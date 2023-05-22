import TileManager, { Tile, House, Drawable } from "./Drawable.js";
import Images from "./Images.js";
import { LayerManager } from "./Layer.js";
import { Cursor, drawText } from "./index.js";

export default class World {
    // Set this higher for more hilly terrain
    static WORLD_HEIGHT = 64;

    // This needs to be this, else it'll either flood the map or just be one tile of water
    static WATER_LEVEL = Math.round(World.WORLD_HEIGHT / 2) - 1;

    // Size of the map, if these are set much higher the browser won't be able to handle it.
    static MAX_X = 64;
    static MAX_Z = 64;

    static loadWorldFromStorage = true;

    static async generate(tiles = []) {
        var start = performance.now();
        var tileHash = {};

        if (World.loadWorldFromStorage && localStorage.getItem("world") != null) {
            console.log("Loading World");
            tiles = JSON.parse(localStorage.getItem("world"));
            tiles = tiles.map(tile => {
                if (Object.keys(Images.Tiles).includes(tile.type)) {
                    return new Tile(tile.x, tile.y, tile.z, tile.type);
                } else if (Object.keys(Images.Houses).includes(tile.type)) {
                    return new House(tile.x, tile.y, tile.z, tile.type);
                }
            });

            console.log("World Loaded; %sms", performance.now() - start);

            return tiles;
        }

        console.log("Generating World");

        for (var z = -1; z <= World.MAX_Z; z += 0.5) {
            for (var x = -1; x <= World.MAX_X; x += 0.5) {
                if ((x % 1 != 0 && z % 1 == 0) || (x % 1 == 0 && z % 1 != 0)) continue;
                var y = Math.round(Math.random()*World.WORLD_HEIGHT);
                var tile = new Tile(x, y, z);
                tiles.push(tile);

                if (tileHash[tile.hash] == undefined) {
                    tileHash[tile.hash] = [];
                }
                tileHash[tile.hash].push(tile);
            }
        }    

        // The higher the depth value is, the flatter the world is
        // A value of 10 seems to work well with the type of game I'm making
        var depth = 10;
        for (var i = 0; i < depth; i++) {
            console.log("Interpolating world; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Interpolating world; Depth: " + (i+1) + "/" + depth);
            await new Promise((resolve) => { requestIdleCallback(() => { tiles = World.#interpolate(tiles, tileHash); resolve(); }, { timeout: 100 }); });
            tileHash = {};
            tiles.forEach((tile) => {
                if (tileHash[tile.hash] == undefined) {
                    tileHash[tile.hash] = [];
                }
                tileHash[tile.hash].push(tile);
            });
        }

        tiles.forEach(tile => {
            if (tile.type == "WATER") tile.y = World.WATER_LEVEL;
        });
        tileHash = {};
        tiles.forEach((tile) => {
            if (tileHash[tile.hash] == undefined) {
                tileHash[tile.hash] = [];
            }
            tileHash[tile.hash].push(tile);
        });

        var depth = World.WORLD_HEIGHT;
        var dirt = undefined;
        for (var i = 0; i < depth; i++) {
            console.log("Generating dirt; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Generating dirt; Depth: " + (i+1) + "/" + depth);
            await new Promise((resolve) => { requestIdleCallback(() => {
                dirt = World.#generateDirt(tiles, dirt, tileHash);
                tiles.push(...dirt);
                dirt.forEach((tile) => {
                    if (tileHash[tile.hash] == undefined) {
                        tileHash[tile.hash] = [];
                    }
                    tileHash[tile.hash].push(tile);
                });
                resolve();
            }, { timeout: 100 }); });
        }

        console.log("Spawning houses; %sms", performance.now() - start);
        drawText("Spawning houses");
        await new Promise((resolve) => { requestIdleCallback(() => { tiles.push(...World.#spawnHouses(tiles)); resolve(); }, { timeout: 100 }); });

        console.log("World generated; %sms", performance.now() - start);

        // Move the tiles so that they're on screen
        tiles.forEach(tile => tile.y -= World.WATER_LEVEL);

        // Make sure that tiles which are higher up on the screen are rendered first
        // Also make sure that tiles with a lower y-position are rendered first
        tiles.sort((a, b) => (a.y) - (b.y));
        tiles.sort((a, b) => (a.z) - (b.z));

        if (World.loadWorldFromStorage && localStorage.getItem("world") == null) {
            console.log("Saving world to storage");
            localStorage.setItem("world", JSON.stringify(tiles));
        }

        return tiles;
    }

    /**
     * @param {Tile[]} tiles 
     * @returns {Tile[]}
     */
    static #interpolate(tiles, tileHash) {
        var interpolatedTiles = [];
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            var neighbours = [
                tileHash[Drawable.getHash(tile.x - 1, tile.z)]?.[0],
                tileHash[Drawable.getHash(tile.x + 1, tile.z)]?.[0],
                tileHash[Drawable.getHash(tile.x, tile.z - 1)]?.[0],
                tileHash[Drawable.getHash(tile.x, tile.z + 1)]?.[0],

                tileHash[Drawable.getHash(tile.x - 0.5, tile.z - 0.5)]?.[0],
                tileHash[Drawable.getHash(tile.x + 0.5, tile.z + 0.5)]?.[0],
                tileHash[Drawable.getHash(tile.x + 0.5, tile.z - 0.5)]?.[0],
                tileHash[Drawable.getHash(tile.x - 0.5, tile.z + 0.5)]?.[0]
            ];

            neighbours = neighbours.filter(x => x != undefined);
            var averageHeight = neighbours.reduce((t, a) => t + a.y, 0) / neighbours.length;

            interpolatedTiles.push(new Tile(tile.x, Math.round(averageHeight), tile.z));
        }

        return interpolatedTiles;
    }

    /**
     * @param {Tile[]} tiles
     * @returns {Tile[]}
     */
    static #generateDirt(tiles, dirt, tileHash) {
        var dirtTiles = [];
        (dirt || tiles.filter(x => x.type == "GRASS")).forEach(tile => {
            // Check whether or not there's already a tile under this
            if (tileHash[tile.hash].some(t => t.y == tile.y - 1)) return;

            // The dirt needs to be visible if there's a tile SW or SE which
            // has a y-position which is 2 (or more) lower than the current tile's
            if (
                tileHash[Drawable.getHash(tile.x + 0.5, tile.z + 0.5)]?.some(t => t.y <= tile.y - 2) || 
                tileHash[Drawable.getHash(tile.x - 0.5, tile.z + 0.5)]?.some(t => t.y <= tile.y - 2)
            ) {
                dirtTiles.push(new Tile(tile.x, tile.y - 1, tile.z, "DIRT"));
            }
        });

        return dirtTiles;
    }

    static #spawnHouses(tiles) {
        var houseTiles = [];
        tiles.forEach(tile => {
            if (tile.type == "GRASS" && Math.random() > 0.95) {
                houseTiles.push(new House(tile.x, tile.y + 1, tile.z, "VARIANT_1"));
            }
        });

        var depth = 5;
        for (var i = 0; i < depth; i++) {
            console.log("Spawning houses; Depth: %s/%s", i+1, depth);
            drawText("Spawning houses; Depth: " + (i+1) + "/" + depth);
            houseTiles = houseTiles.filter(tile => {
                var neighbours = houseTiles.filter(t => t.x >= tile.x - 2 && t.x <= tile.x + 2 && t.z >= tile.z - 2 && t.z <= tile.z + 2);
                return neighbours.length > 3;
            });
        }

        return houseTiles;
    }
}

export class Camera {
    static #position = { x: 0, z: 0 };
    static #zoom = 1;

    /**
     * Move the camera
     * @param {number} x 
     * @param {number} z 
     */
    static moveBy(x = 0, z = 0) {
        Camera.moveTo(Camera.getPosition().x + x, Camera.getPosition().z + z);
        LayerManager.shouldRenderLayer("world");
        Cursor.updateSelectedTile();
    }

    /**
     * Move the camera
     * @param {number} x 
     * @param {number} z 
     */
    static moveTo(x = Camera.#position.x, z = Camera.#position.z) {
        // A tile with the maximum allowed coordinates
        var tile = new Drawable(World.MAX_X, World.WORLD_HEIGHT - World.WATER_LEVEL, World.MAX_Z);
        var middlePoint = tile.getMiddlePoint(true);

        x = Math.min(middlePoint.x - clientWidth, Math.max(0, x));
        z = Math.min(middlePoint.y - clientHeight, Math.max(0, z));

        Camera.#position = { x, z };
    }
    
    /**
     * @returns {{x: number, z: number}} The position of the camera
     */
    static getPosition() {
        return Camera.#position;
    }

    static zoomOut() {
        Camera.zoom /= 1.1;
    }

    static zoomIn() {
        Camera.zoom *= 1.1;
    }

    static get zoom() {
        return Camera.#zoom;
    }

    static set zoom(value) {
        var oldValue = Camera.#zoom;
        
        Camera.#zoom = value;
        
        var tile = new Drawable(World.MAX_X, World.WORLD_HEIGHT - World.WATER_LEVEL, World.MAX_Z);
        var middlePoint = tile.getMiddlePoint(true);
        if (Camera.#position.x != Math.min(middlePoint.x - clientWidth, Math.max(0, Camera.#position.x)) || Camera.#position.z != Math.min(middlePoint.y - clientHeight, Math.max(0, Camera.#position.z))) {
            Camera.#zoom = oldValue;
            Camera.moveBy(0, 0);
            return;
        }

        Cursor.updateSelectedTile();
        LayerManager.shouldRenderLayer("world");
        TileManager.getTiles().forEach(tile => {
            // Update width and height
            tile.width = 0;
            tile.height = 0;
        });
    }
}