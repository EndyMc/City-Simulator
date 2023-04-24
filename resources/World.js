import { Tile } from "./Tile.js";
import { drawText } from "./index.js";

export default class World {
    static WATER_LEVEL = 15;
    static WORLD_HEIGHT = 32;
    static MAX_X = 64;
    static MAX_Z = 64;

    static generate(tiles = []) {
        console.log("Generating World");
        drawText("Generating World");

        var start = performance.now();

        for (var z = -1; z <= World.MAX_Z; z += 0.5) {
            for (var x = -1; x <= World.MAX_X; x += 0.5) {
                if ((x % 1 != 0 && z % 1 == 0) || (x % 1 == 0 && z % 1 != 0)) continue;
                var y = Math.round(Math.random()*World.WORLD_HEIGHT);
                tiles.push(new Tile(x, y, z));
            }
        }    

        var depth = 10;
        for (var i = 0; i < depth; i++) {
            console.log("Interpolating world; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Interpolating world; Depth: " + (i+1) + "/" + depth + "; " + (performance.now() - start) + "ms");
            tiles = World.#interpolate(tiles);
            tiles.forEach(t => t.render(window.ctx));
        }

        var depth = 5;
        for (var i = 0; i < depth; i++) {
            console.log("Interpolating water; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Interpolating water; Depth: " + (i+1) + "/" + depth + "; " + (performance.now() - start) + "ms");
            var water = tiles.filter(t => t.type == "WATER");
            tiles = tiles.filter(t => t.type != "WATER");
            tiles.push(...World.#interpolateWater(water));
        }

        var depth = 1;
        for (var i = 0; i < depth; i++) {
            console.log("Generating dirt; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            drawText("Generating dirt; Depth: " + (i+1) + "/" + depth + "; " + (performance.now() - start) + "ms");
            tiles.push(...World.#generateDirt(tiles));
        }

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
    static #generateDirt(tiles) {
        var dirtTiles = [];
        tiles.forEach(tile => {
            if (tiles.filter(x => x.type == "DIRT").some(t => t.y == tile.y && t.x == tile.x && t.z == tile.z)) return;

            // The dirt needs to be visible if there's a tile SW or SE which
            // has a y-position which is 2 (or more) lower than the current tile's
            if (tiles.some(t => t.y <= tile.y - 2 && (t.x == tile.x + 0.5 || t.x == tile.x - 0.5 || t.z == tile.z - 0.5 || t.z == tile.z + 0.5))) {
                dirtTiles.push(new Tile(tile.x, tile.y - 1, tile.z, "DIRT"));
            }
        });

        return dirtTiles;
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