import World, { Camera } from "./World.js";
import Images from "./Images.js";

export class Tile {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y, z, type) {
        if (type == undefined) {
            if (y <= World.WATER_LEVEL) {
                type = "WATER";
            } else {
                type = "GRASS";
            }
        }

        this.type = type;
        this.imagePath = Images.Tiles[type];
        
        this.size = Math.floor(innerWidth / 16);

        this.width = this.size / Math.sqrt(3);
        this.height = this.size / 2;

        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Render this tile
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        if (!Images.cacheContains(this.imagePath)) return;

        var x = this.x * this.width - Camera.getPosition().x;
        if (x + this.width < 0 || x > innerWidth) return;

        var y = this.z * this.height * (2/3) - this.y * this.size / 6 - Camera.getPosition().z;
        if (y + this.height < 0 || y > innerHeight) return;

        ctx.drawImage(Images.getImageFromCache(this.imagePath), x, y);
    }
}

export default class TileManager {
    static #tiles = [];

    /**
     * @returns {Tile[]} A copy of the tiles array
     */
    static getTiles() {
        return TileManager.#tiles;
    }

    static generate() {
        TileManager.#tiles = World.generate();
    }

    static clear() {
        TileManager.#tiles = [];
    }
}