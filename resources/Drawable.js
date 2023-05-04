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
        
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get size() {
        return clientWidth / 16 * Camera.zoom;
    }

    get width() {
        return this.size / Math.sqrt(3);
    }

    get height() {
        return this.size / 2;
    }

    /**
     * Render this tile
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        if (!Images.cacheContains(this.imagePath)) return;

        var position = this.getScreenPosition();
        if (position == undefined) return;

        ctx.drawImage(Images.getImageFromCache(this.imagePath), position.x, position.y, this.width, this.height);

        if (!(this instanceof Tile)) return;

        var { x, y } = this.getMiddlePoint();

//        ctx.save();
//            ctx.fillStyle = "aqua";
//            ctx.beginPath();
//            ctx.arc(x, y, this.width * 0.05, 0, Math.PI * 2);
//            ctx.fill();
//        ctx.restore();

        if (this.selected) {
            var bounds = this.getBoundingBox();

            // Hover effect
            ctx.save();
                ctx.fillStyle = "white";
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                    ctx.moveTo(bounds.x1, y);
                    ctx.lineTo(x, bounds.y1);
                    ctx.lineTo(bounds.x2, y);
                    ctx.lineTo(x, position.y + this.width / Math.sqrt(3));
                ctx.closePath();
                ctx.fill();
            ctx.restore();
        }
    }

    /**
     * @returns {{x: number, y: number}}
     */
    getScreenPosition() {
        var x = this.x * this.width - Camera.getPosition().x;
        if (x + this.width < 0 || x > clientWidth) return;

        var y = this.z * this.height * (2/3) - this.y * this.height / 3 - Camera.getPosition().z;
        if (y + this.height < 0 || y > clientHeight) return;

        return { x, y };
    }

    /**
     * @returns {{ x1: number, y1: number, x2: number, y2: number }} The four corners of this
     */
    getBoundingBox() {
        var position = this.getScreenPosition();
        return {
            x1: (position?.x) || -1,
            y1: (position?.y) || -1,
            x2: (position?.x + this.width) || -1,
            y2: (position?.y + this.height) || -1
        }
    }

    /**
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {boolean}
     */
    contains(screenX, screenY) {
        var bounds = this.getBoundingBox();
        return bounds.x1 <= screenX && bounds.x2 >= screenX && bounds.y1 <= screenY && bounds.y2 >= screenY;
    }

    /**
     * @returns {{ x: number, y: number }} The middle of the top portion of the tile
     */
    getMiddlePoint() {
        var position = this.getScreenPosition();

        return {
            x: (position?.x + this.width / 2) || -1,
            y: (position?.y + this.width / Math.sqrt(3) / 2) || -1
        }
    }

    /**
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {number} distance from the given point to the middle of this drawable
     */
    distance(screenX, screenY) {
        var position = this.getScreenPosition();

        // This is undefined if the object is offscreen
        if (position == undefined) return Infinity;

        // The point in the middle of this drawable
        var { x, y } = this.getMiddlePoint();

        // Pythagoras
        var distance = Math.hypot(x - screenX, y - screenY);

        return distance;
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
        // Get candidates for which tiles are the most likely to be the one the user hovers
        var candidates = TileManager.#tiles.filter(tile => {
            if (!(tile instanceof Tile)) {
                // Don't check houses and other such entities
                return false;
            }

            tile.selected = false;

            return tile.contains(screenX, screenY);
        })
            // Sort by y-coordinate
            .sort((a, b) => b.y - a.y)
            
            // Sort by z-coordinate
            .sort((a, b) => b.z - a.z)

            // Sort by distance from mouse
            .sort((a, b) => a.distance(screenX, screenY) - b.distance(screenX, screenY));

        // Return to most likely one
        return candidates[0];
    }
}