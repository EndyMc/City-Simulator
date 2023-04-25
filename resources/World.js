import { Tile, House } from "./Drawable.js";
import { drawText } from "./index.js";

export default class World {
    static WATER_LEVEL = 15;
    static WORLD_HEIGHT = 32;
    static MAX_X = 64;
    static MAX_Z = 64;

    static async generate(tiles = []) {
        console.log("Generating World");

        var start = performance.now();

        for (var z = -1; z <= World.MAX_Z; z += 0.5) {
            for (var x = -1; x <= World.MAX_X; x += 0.5) {
                if ((x % 1 != 0 && z % 1 == 0) || (x % 1 == 0 && z % 1 != 0)) continue;
                var y = Math.round(Math.random()*World.WORLD_HEIGHT);
                tiles.push(new Tile(x, y, z));
            }
        }    

        // The higher the depth value is, the flatter the world is
        // A value of 10 seems to work well with the type of game I'm making
        // The depth value makes the world generation take about 3.5 seconds longer for each step (3.5 seconds * 10 = 35 seconds)
        var depth = 10;
        for (var i = 0; i < depth; i++) {
            console.log("Interpolating world; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Interpolating world; Depth: " + (i+1) + "/" + depth + "; " + (performance.now() - start) + "ms");
            tiles = World.#interpolate(tiles);
        }

        var depth = 5;
        for (var i = 0; i < depth; i++) {
            console.log("Interpolating water; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Interpolating water; Depth: " + (i+1) + "/" + depth + "; " + (performance.now() - start) + "ms");
            var water = tiles.filter(t => t.type == "WATER");
            tiles = tiles.filter(t => t.type != "WATER");
            tiles.push(...World.#interpolateWater(water));
        }

        var depth = 5;
        for (var i = 0; i < depth; i++) {
            console.log("Generating dirt; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Generating dirt; Depth: " + (i+1) + "/" + depth + "; " + (performance.now() - start) + "ms");
            tiles.push(...World.#generateDirt(tiles, i));
        }

        console.log("Spawning houses; %sms", performance.now() - start);
        drawText("Spawning houses; " + (performance.now() - start) + "ms");
        tiles.push(...World.#spawnHouses(tiles));

        console.log("World generated; %sms", performance.now() - start);

        // Make sure that tiles which are higher up on the screen are rendered first
        // Also make sure that tiles with a lower y-position are rendered first
        tiles.sort((a, b) => (a.y) - (b.y));
        tiles.sort((a, b) => (a.z) - (b.z));

        return tiles;
    }

    /**
     * @param {Tile[]} tiles 
     * @returns {Tile[]}
     */
    static #interpolate(tiles) {
        var interpolatedTiles = [];
        tiles.forEach(tile => {
            var neighbours = tiles.filter(t => t.x >= tile.x - 1 && t.x <= tile.x + 1 && t.z >= tile.z - 1 && t.z <= tile.z + 1);
            var averageHeight = neighbours.reduce((t, a) => t + a.y, 0) / neighbours.length;
            interpolatedTiles.push(new Tile(tile.x, Math.round(averageHeight), tile.z));
        });

        return interpolatedTiles;
    }

    /**
     * @param {Tile[]} tiles 
     * @returns {Tile[]}
     */
    static #interpolateWater(tiles) {
        var interpolatedTiles = [];
        tiles.filter(t => t.type == "WATER").forEach(tile => {
            var neighbours = tiles.filter(t => t.x >= tile.x - 1 && t.x <= tile.x + 1 && t.z >= tile.z - 1 && t.z <= tile.z + 1);
            var height = Math.max(...neighbours.map(t => t.y));
            interpolatedTiles.push(new Tile(tile.x, height, tile.z));
        });

        return interpolatedTiles;
    }

    /**
     * @param {Tile[]} tiles
     * @returns {Tile[]}
     */
    static #generateDirt(tiles, depth) {
        var dirtTiles = [];
        var firstDepth = depth == 0;
        tiles
            .filter(x => (x.type == "GRASS" && firstDepth) || (x.type == "DIRT" && !firstDepth))
            .forEach(tile => {
            // Check whether or not there's already a tile under this
            if (tiles.some(t => t.y == tile.y - 1 && t.z == tile.z && t.x == tile.x)) return;

            // The dirt needs to be visible if there's a tile SW or SE which
            // has a y-position which is 2 (or more) lower than the current tile's
            if (tiles.some(t => t.y <= tile.y - 2 && t.z == tile.z + 0.5 && (t.x == tile.x + 0.5 || t.x == tile.x - 0.5))) {
                dirtTiles.push(new Tile(tile.x, tile.y - 1, tile.z, "DIRT"));
            }
        });

        return dirtTiles;
    }

    static #spawnHouses(tiles) {
        var houseTiles = [];
        tiles.filter(x => x.type == "GRASS").forEach(tile => {
            if (Math.random() > 0.95) houseTiles.push(new House(tile.x, tile.y + 1, tile.z, "VARIANT_1"));
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

    /**
     * Move the camera
     * @param {number} x 
     * @param {number} z 
     */
    static moveBy(x = 0, z = 0) {
        Camera.moveTo(Camera.getPosition().x + x, Camera.getPosition().z + z);
    }

    /**
     * Move the camera
     * @param {number} x 
     * @param {number} z 
     */
    static moveTo(x = Camera.#position.x, z = Camera.#position.z) {
        var size = Math.floor(innerWidth / 16);

        x = Math.min(size / Math.sqrt(3) * World.MAX_X - innerWidth, Math.max(size / Math.sqrt(3) / (-2), x));
        z = Math.min((size * (2/3) * World.MAX_Z - (World.WORLD_HEIGHT * size / 6) - 2*innerHeight) / 2 - size * (2/3) / 2, Math.max(size * (2/3) - (World.WATER_LEVEL * size / 6), z));

        Camera.#position = { x, z };
    }
    
    /**
     * @returns {{x: number, z: number}} The position of the camera
     */
    static getPosition() {
        return Camera.#position;
    }
}