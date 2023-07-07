import TileManager, { Tile, House, Drawable } from "./Drawable.mjs";
import Images from "./Images.mjs";
import { LayerManager } from "./Layer.mjs";
import { LoadingMenu } from "./Menu.mjs";
import { Storage } from "./Storage.mjs";
import { Cursor } from "./index.mjs";


export default class World {
    static worker = new Worker("resources/workers/World_Generator.mjs");

    // Set this higher for more hilly terrain
    static WORLD_HEIGHT = 64;

    // This needs to be this, else it'll either flood the map or just be one tile of water
    static WATER_LEVEL = Math.round(World.WORLD_HEIGHT / 2) - 1;

    // Size of the map, if these are set much higher the browser won't be able to handle it.
    static MAX_X = 64;
    static MAX_Z = 64;

    static LOWEST_POINT = World.WORLD_HEIGHT;
    static HIGHEST_POINT = 0;

    static #world;

    static async generate(tiles = [], startX = 0 - 1, startZ = 0 - World.WORLD_HEIGHT, endX = World.MAX_X + 1, endZ = World.MAX_Z + World.WORLD_HEIGHT, connectedTiles = []) {
        var start = performance.now();
        var tileHash = {};
        
        console.log("Loading World");
        if (World.#world == undefined) World.#world = await Storage.get().getAll();

        tiles.push(...World.#world.filter(t => t.x >= startX && t.x <= endX && t.z >= startZ && t.z <= endZ));

        if (tiles.length > 0) {
            console.log("World found in Storage");
            return tiles.map(t => {
                World.LOWEST_POINT = Math.min(World.LOWEST_POINT, t.y);
                World.HIGHEST_POINT = Math.max(World.HIGHEST_POINT, t.y);

                return new Tile(t.x, t.y, t.z, t.type);
            });
        }

        console.log("World not found in Storage\nGenerating new World");

        return new Promise((resolve) => {
            var callback = (event) => {
                var data = event.data;
                if (startX == data.startX && startZ == data.startZ && endX == data.endX && endZ == data.endZ) {
                    removeEventListener("message", callback);

                    var tiles = data.tiles.map(t => {
                        World.LOWEST_POINT = Math.min(World.LOWEST_POINT, t.y);
                        World.HIGHEST_POINT = Math.max(World.HIGHEST_POINT, t.y);

                        return new Tile(t.x, t.y, t.z, t.type);
                    });

                    Storage.get().saveAll(tiles.map(t => t.key), tiles.map(t => t.toString()));

                    resolve(tiles);
                }
            };
            World.worker.postMessage({ function: "generate", params: [ startX, startZ, endX, endZ ] });
            World.worker.addEventListener("message", callback);
        });

        if (World.#world == undefined) World.#world = await Storage.get().getAll();

        tiles = World.#world.filter(t => t.x >= startX && t.x <= endX && t.z >= startZ && t.z <= endZ);        
        if (tiles.length > 0) {
            LoadingMenu.loadingText = "Loading World";
            LoadingMenu.currentProcessText = "";

            tiles = tiles.map(tile => {
                if (Object.keys(Images.Tiles).includes(tile.type)) {
                    return new Tile(tile.x, tile.y, tile.z, tile.type);
                } else if (Object.keys(Images.Houses).includes(tile.type)) {
                    return new House(tile.x, tile.y, tile.z, tile.type);
                }
            });
            
            console.log("World Loaded; %sms", performance.now() - start);
            
            tiles.sort((a, b) => (a.y) - (b.y));
            tiles.sort((a, b) => (a.z) - (b.z));    
            
            return tiles;
        }

        console.log("World Not Found In Cache");
        console.log("Generating New Terrain");
        
        for (var z = startZ; z <= endZ; z += 0.5) {
            for (var x = startX; x <= endX; x += 0.5) {
                if ((x % 1 != 0 && z % 1 == 0) || (x % 1 == 0 && z % 1 != 0)) continue;
                var y = Math.round(Math.random()*World.WORLD_HEIGHT);
                var tile = new Tile(x, y, z);
                var hash = tile.hash;
                tiles.push(tile);
                
                if (tileHash[hash] == undefined) {
                    tileHash[hash] = [];
                }
                tileHash[hash].push(tile);
            }
        }    

        connectedTiles.forEach(t => {
            var hash = t.hash;
            if (tileHash[hash] == undefined) {
                tileHash[hash] = [];
            }
            tileHash[hash].push(t);
        });
        
        LoadingMenu.loadingText = "Interpolating World";

        // The higher the depth value is, the flatter the world is
        // A value of 10 seems to work well with the type of game I'm making
        var depth = 10;
        for (var u = 0; u < depth; u++) {
            console.log("Interpolating world; Depth: %s/%s; %sms", u+1, depth, performance.now() - start);
            LoadingMenu.currentProcessText = (u + 1) + "/" + depth;

            await new Promise((resolve) => { requestIdleCallback(() => {
                var interpolatedTiles = World.#interpolate(tiles, tileHash);
                
                for (var i = 0; i < tiles.length; i++) {
                    tiles[i].y = interpolatedTiles[i];
                }
        
                resolve();
            }, { timeout: 100 }); });
        }

        var len = tiles.length;
        var waterPath = Images.Tiles.WATER;
        var grassPath = Images.Tiles.GRASS;
        for (var i = 0; i < len; i++) {
            var tile = tiles[i];
            if (tile.y <= World.WATER_LEVEL) {
                tile.type = "WATER";
                tile.imagePath = waterPath;

                tile.y = World.WATER_LEVEL;
            } else if (tile.type == "WATER") {
                tile.type = "GRASS";
                tile.imagePath = grassPath;
            }
        }

        LoadingMenu.loadingText = "Generating Dirt";

        var depth = World.WORLD_HEIGHT;
        var dirt = undefined;
        for (var i = 0; i < depth; i++) {
            console.log("Generating dirt; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            LoadingMenu.currentProcessText = (i + 1) + "/" + depth;

            await new Promise((resolve) => { requestIdleCallback(() => {
                dirt = World.#generateDirt([ ...tiles, ...connectedTiles ], dirt, tileHash);

                tiles.push(...dirt);
                dirt.forEach((tile) => {
                    var hash = tile.hash;
                    if (tileHash[hash] == undefined) {
                        tileHash[hash] = [];
                    }
                    tileHash[hash].push(tile);
                });
                resolve();
            }, { timeout: 100 }); });
        }

        console.log("Spawning houses; %sms", performance.now() - start);
        LoadingMenu.loadingText = "Spawning houses";
        await new Promise((resolve) => { requestIdleCallback(() => { tiles.push(...World.#spawnHouses(tiles)); resolve(); }, { timeout: 100 }); });

        console.log("World generated; %sms", performance.now() - start);

        // Move the tiles so that they're on screen
//        tiles.forEach(tile => tile.y -= World.WATER_LEVEL);

        // Make sure that tiles which are higher up on the screen are rendered first
        // Also make sure that tiles with a lower y-position are rendered first
        tiles.sort((a, b) => (a.y) - (b.y));
        tiles.sort((a, b) => (a.z) - (b.z));

        console.log("Saving world to storage; %sms", performance.now() - start);
        
        World.#world = [ ...TileManager.getTiles(), ...tiles ];
        Storage.get().saveAll(tiles.map(t => t.key), tiles.map(t => t.toString()));

        console.log("World Saved; %sms", performance.now() - start);

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

            interpolatedTiles.push(Math.round(averageHeight));
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

    /**
     * 
     * @param {Tile[]} tiles 
     * @returns {House[]}
     */
    static #spawnHouses(tiles) {
        return [];
        var houseTiles = [];
        tiles.forEach(tile => {
            if (tile.type == "GRASS" && Math.random() > 0.95) {
                houseTiles.push(new House(tile.x, tile.y + 1, tile.z, "VARIANT_1"));
            }
        });

        var depth = 5;
        for (var i = 0; i < depth; i++) {
            console.log("Spawning houses; Depth: %s/%s", i+1, depth);
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

    static MAX_ZOOM = 3;
    static MIN_ZOOM = 0.5;

    /**
     * Move the camera
     * @param {number} x 
     * @param {number} z 
     */
    static moveBy(x = 0, z = 0) {
        var moved = Camera.moveTo(Camera.getPosition().x + x, Camera.getPosition().z + z);

        if (!moved) return;

        LayerManager.shouldRenderLayer("world");
        Cursor.updateSelectedTile();
    }

    static generatingTerrain = false;

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

        if (Camera.#position.x == x && Camera.#position.z == z) return false;

        if (!Camera.generatingTerrain) {
            var tiles = TileManager.getTiles();
            
            var tileX = tiles.map(t => t.x);
            var tileZ = tiles.map(t => t.z);
            
            var minX = Math.min(...tileX);
            var minZ = Math.min(...tileZ);
            var maxX = Math.max(...tileX);
            var maxZ = Math.max(...tileZ);
            
            var minScreen = TileManager.getTileHashes()[new Drawable(minX, 0, minZ).hash]?.[0]?.getScreenPosition(true) || { x: -1, y: -1 };
            var maxScreen = TileManager.getTileHashes()[new Drawable(maxX, 0, maxZ).hash]?.[0]?.getScreenPosition(true) || { x: -1, y: -1 };

            Camera.generatingTerrain = true;
            if (Math.abs(minScreen.x - x) < clientWidth*0.5) {
                TileManager.generate(undefined, minX - 16, minZ, minX - 0.5, maxZ, tiles.filter(t => t.x == minX));
            } else if (Math.abs(maxScreen.x - x) < clientWidth*1.5) {
                TileManager.generate(undefined, maxX + 0.5, minZ, maxX + 16, maxZ, tiles.filter(t => t.x == maxX));
            } else if (Math.abs(minScreen.y - z) < clientWidth*0.5) {
                TileManager.generate(undefined, minX, minZ - 16, maxX, minZ - 0.5, tiles.filter(t => t.z == minZ));
            } else if (Math.abs(maxScreen.y - z) < clientHeight + 0.5*clientWidth) {
                TileManager.generate(undefined, minX, maxZ + 0.5, maxX, maxZ + 16, tiles.filter(t => t.z == maxZ));
            } else {
                Camera.generatingTerrain = false;
            }
        }

        Camera.#position = { x, z };
        return true;
    }
    
    static get width() {
        return clientWidth / Camera.zoom;
    }

    static get height() {
        return clientHeight / Camera.zoom;
    }

    /**
     * @returns {{x: number, z: number}} The position of the camera
     */
    static getPosition() {
        return Camera.#position;
    }

    static zoomOut() {
        if (Camera.zoom <= Camera.MIN_ZOOM) {
            return;
        }

        Camera.zoom = Math.max(Camera.MIN_ZOOM, Camera.zoom * 0.9);
    }

    static zoomIn() {
        if (Camera.zoom >= Camera.MAX_ZOOM) {
            return;
        }

        Camera.zoom = Math.min(Camera.MAX_ZOOM, Camera.zoom * 1.1);
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
        
        var updatedImages = {};

        Cursor.updateSelectedTile();
        LayerManager.shouldRenderLayer("world");
        TileManager.getTiles().forEach(tile => {
            // Update width and height
            tile.width = 0;
            tile.height = 0;

            if (updatedImages[tile.imagePath] == undefined && !Images.cacheContains(tile.imagePath, tile.width, tile.height)) {
                tile.image = Images.getImage(tile.imagePath, tile.width, tile.height);
            } else {
                tile.image = Images.getImageFromCache(tile.imagePath, tile.width, tile.height);
            }

            updatedImages[tile.imagePath] = true;
        });
    }
}