import World, { Camera } from "./World.js";
import Images from "./Images.js";

export class Drawable {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z
     * @param {String} type
     */
    constructor(x, y, z, imagePath, type) {
        this.type = type;
        this.imagePath = imagePath;
        
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

        var position = this.getScreenPosition();
        if (position == undefined) return;

        ctx.drawImage(Images.getImageFromCache(this.imagePath), position.x, position.y);
    }

    /**
     * @returns {{x: number, y: number}}
     */
    getScreenPosition() {
        var x = this.x * this.width - Camera.getPosition().x;
        if (x + this.width < 0 || x > innerWidth) return;

        var y = this.z * this.height * (2/3) - this.y * this.size / 6 - Camera.getPosition().z;
        if (y + this.height < 0 || y > innerHeight) return;

        return { x, y };
    }

    /**
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {boolean}
     */
    contains(screenX, screenY) {
        var position = this.getScreenPosition();
        return position != undefined && position.x <= screenX && position.x + this.width >= screenX && position.y <= screenY && position.y + this.height >= screenY;
    }
}

export class House extends Drawable {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y, z, type = "VARIANT_1") {
        super(x, y, z, Images.Houses[type], type);
    }
}

export class Tile extends Drawable {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z
     * @param {String} type
     */
    constructor(x, y, z, type) {
        if (type == undefined) {
            if (y <= World.WATER_LEVEL) {
                type = "WATER";
            } else {
                type = "GRASS";
            }
        }

        super(x, y, z, Images.Tiles[type], type);
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

    static async generate() {
        TileManager.#tiles = await World.generate();
    }

    static getHighlightedTile(screenX, screenY) {
        return TileManager.#tiles.filter(tile => {
            if (!(tile instanceof Tile)) {
                // Don't check houses and other such entities
                return false;
            }

            return tile.contains(screenX, screenY);
        }).sort((a, b) => b.y - a.y).sort((a, b) => b.z - a.z)[0];
    }
}