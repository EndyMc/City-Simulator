import World, { Camera } from "./World.mjs";
import Images from "./Images.mjs";
import { Cursor } from "./index.mjs";

export class Drawable {
    #width = this.size / Math.sqrt(3);
    #height = this.size / 2;

    #image = undefined;

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

    set width(_) {
        this.#width = this.size / Math.sqrt(3);
    }
    
    set height(_) {
        this.#height = this.size / 2;
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    get key() {
        return "x" + Math.round(10*this.x) + "y" + Math.round(10*this.y) + "z" + Math.round(10*this.z);
    }

    get hash() {
        return Drawable.getHash(this.x, this.z);
    }

    get image() {
        if (this.#image == undefined) {
            if (!Images.cacheContains(this.imagePath)) return;
            this.#image = Images.getImageFromCache(this.imagePath);
        }
        
        return this.#image;
    }

    static getHash(x, z) {
        return "x" + Math.round(10*x) + "z" + Math.round(10*z);
    }

    /**
     * Render this tile
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        if (this.image == undefined) return;

        var position = this.getScreenPosition();
        if (position == undefined) return;

        var img = this.image;
        var x = position.x;
        var y = position.y;
        var w = this.width;
        var h = this.height;

        ctx.drawImage(img, x, y, w, h);

        if (this.selected) {
            var { x, y } = this.getMiddlePoint();
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
    getScreenPosition(ignoreOutOfBounds = false) {
        var cameraPosition = Camera.getPosition();

        var x = this.x * this.width - (ignoreOutOfBounds ? 0 : cameraPosition.x);
        if (!ignoreOutOfBounds && (x + this.width < 0 || x > clientWidth)) return;

        var y = this.z * this.height * (2/3) - this.y * this.height / 3 - (ignoreOutOfBounds ? 0 : cameraPosition.z);
        if (!ignoreOutOfBounds && (y + this.height < 0 || y > clientHeight)) return;

        return { x, y };
    }

    get isometricBoundingBox() {
        var { x, y } = this.getMiddlePoint();
        var position = this.getScreenPosition();
        var bounds = this.getBoundingBox();

        return {
            up: { x, y: bounds.y1 },
            down: { x, y: position.y + this.width / Math.sqrt(3) },
            left: { x: bounds.x1, y },
            right: { x: bounds.x2, y }
        }
    }

    /**
     * @returns {{ x1: number, y1: number, x2: number, y2: number }} The four corners of this
     */
    getBoundingBox() {
        var position = this.getScreenPosition();
        if (position == undefined) {
            return {
                x1: -1,
                y1: -1,
                x2: -1,
                y2: -1
            }
        } else {
            return {
                x1: position.x,
                y1: position.y,
                x2: position.x + this.width,
                y2: position.y + this.height
            }
        }
    }

    /**
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {boolean}
     */
    contains(screenX, screenY) {
        var rectangularBounds = this.getBoundingBox();
        
        if (!(rectangularBounds.x1 <= screenX && rectangularBounds.x2 >= screenX && rectangularBounds.y1 <= screenY && rectangularBounds.y2 >= screenY)) return false;
        // Check so that the right side is to the right of the cursor
        // Also check so that the left side isn't to the right of the cursor
        
        var bounds = this.isometricBoundingBox;
        var normalizedCursorPosition = {
            x: screenX - bounds.left.x,
            y: screenY - bounds.up.y
        }
        
        bounds.down = { x: bounds.down.x - bounds.left.x, y: bounds.down.y - bounds.up.y };
        bounds.right = { x: bounds.right.x - bounds.left.x, y: bounds.right.y - bounds.up.y };
        bounds.up.x = bounds.up.x - bounds.left.x;
        bounds.left.y = bounds.left.y - bounds.up.y;
        bounds.up.y = 0;
        bounds.left.x = 0;
        
        var invertedCursorPosition = {
            x: normalizedCursorPosition.x,
            y: bounds.down.y - normalizedCursorPosition.y
        }

        // Calculate the coefficient for each of the edges
        var sides = {
            north_west: (bounds.up.y - bounds.left.y) / (bounds.up.x - bounds.left.x),
            north_east: (bounds.right.y - bounds.up.y) / (bounds.right.x - bounds.up.x),
            south_west: (bounds.down.y - bounds.left.y) / (bounds.down.x - bounds.left.x),
            south_east: (bounds.right.y - bounds.down.y) / (bounds.right.x - bounds.down.x)
        }
        
        /**
         * @param {{ m: number, k: number }} line1 
         * @param {{ m: number, k: number }} line2 
         * @param {{ x: number, y: number }} min 
         * @param {{ x: number, y: number }} max 
         * @returns {boolean} Whether or not these lines intersect, within the defined range
         */
        var intersectHorizontal = (line1, line2, min, max) => {
            min.x -= bounds.down.x;
            max.x -= bounds.down.x;

            var x = bounds.down.x + (line2.m - line1.m) / (line1.k - line2.k);
            var y = line2.k * (x - bounds.down.x) + line2.m;
            
            if ((min.x < 0 && invertedCursorPosition.x < x) || (min.x >= 0 && invertedCursorPosition.x > x) || min.y > y || max.y < y) {
                return false;
            }

            return true;
        }

        /**
         * @param {number} x 
         * @param {{ m: number, k: number }} line2 
         * @param {{ x: number, y: number }} min 
         * @param {{ x: number, y: number }} max 
         * @returns {boolean} Whether or not these lines intersect, within the defined range
         */
        var intersectVertical = (x, line2, min, max) => {
            min.x -= bounds.down.x;
            max.x -= bounds.down.x;

            var y = line2.k * (x - bounds.down.x) + line2.m;
            
            if ((min.y < bounds.left.y && invertedCursorPosition.y < y) || (min.y >= bounds.left.y && invertedCursorPosition.y > y) || min.y > y || max.y < y) {
                return false;
            }

            return true;
        }

        var right = intersectHorizontal({ k: 0, m: invertedCursorPosition.y }, { m: 0, k: -sides.south_east }, { x: bounds.down.x, y: 0 }, { x: bounds.right.x, y: bounds.right.y }) || intersectHorizontal({ k: 0, m: invertedCursorPosition.y }, { m: bounds.down.y, k: -sides.north_east }, { x: bounds.up.x, y: bounds.right.y }, { x: bounds.right.x, y: bounds.down.y });
        var left = intersectHorizontal({ k: 0, m: invertedCursorPosition.y }, { m: 0, k: -sides.south_west }, { x: bounds.left.x, y: 0 }, { x: bounds.down.x, y: bounds.left.y }) || intersectHorizontal({ k: 0, m: invertedCursorPosition.y }, { m: bounds.down.y, k: -sides.north_west }, { x: bounds.left.x, y: bounds.left.y }, { x: bounds.up.x, y: bounds.down.y });
        var up = intersectVertical(invertedCursorPosition.x, { m: bounds.down.y, k: -sides.north_west }, { x: bounds.left.x, y: bounds.left.y }, { x: bounds.down.x, y: bounds.down.y }) || intersectVertical(invertedCursorPosition.x, { m: bounds.down.y, k: -sides.north_east }, { x: bounds.up.x, y: bounds.right.y }, { x: bounds.right.x, y: bounds.down.y });
        var down = intersectVertical(invertedCursorPosition.x, { m: 0, k: -sides.south_west }, { x: bounds.left.x, y: 0 }, { x: bounds.down.x, y: bounds.left.y }) || intersectVertical(invertedCursorPosition.x, { m: 0, k: -sides.south_east }, { x: bounds.down.x, y: 0 }, { x: bounds.right.x, y: bounds.right.y });

        return up && down && right && left;
    }

    /**
     * @returns {{ x: number, y: number }} The middle of the top portion of the tile
     */
    getMiddlePoint(ignoreOutOfBounds = false) {
        var position = this.getScreenPosition(ignoreOutOfBounds);

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

    toString() {
        return { x: this.x, y: this.y, z: this.z, type: this.type };
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
    static #tileHashes = {};

    /**
     * @returns {Tile[]}
     */
    static getTiles() {
        return TileManager.#tiles;
    }

    static getTile(x, y, z) {
        return TileManager.#tileHashes[new Drawable(x, y, z).hash].find(t => t.y == y);
    }

    static getTileHashes() {
        return TileManager.#tileHashes;
    }

    static async generate(tiles, startX, startZ, endX, endZ, connectedTiles) {
        TileManager.#tiles.push(...(await World.generate(tiles, startX, startZ, endX, endZ, connectedTiles)));

        TileManager.#tiles.sort((a, b) => (a.y) - (b.y));
        TileManager.#tiles.sort((a, b) => (a.z) - (b.z));
        
        TileManager.#tiles.forEach(t => {
            var hash = t.hash;
            if (TileManager.#tileHashes[hash]?.includes(t)) return;

            if (TileManager.#tileHashes[hash] == undefined) {
                TileManager.#tileHashes[hash] = [];
            }
            TileManager.#tileHashes[hash].push(t);
        });
        
        Camera.moveBy(0, 0);
        Camera.generatingTerrain = false;
    }

    static unload(startX, startZ, endX, endZ) {
        
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

        // Return to most likely one
        return candidates?.[0] || Cursor.getSelectedTile();
    }
}
window.t = TileManager;

class Vehicle extends Drawable {
    constructor(x, y, z, type) {
        var imagePath = Images.Boats[type];
        super(x, y, z, imagePath, type);
    }

    moveBy(x, z) {
        this.moveTo(x + this.x, z + this.z);
    }

    moveTo(x, z) {
        this.x = x;
        this.z = z;
        this.y = Math.max(...TileManager.getTileHashes()[this.hash].filter(() => true).map(t => t.y)) + 1;
    }
}

export class Boat extends Vehicle {
    constructor(x, y, z) {
        super(x, y, z, "VARIANT_1");
    }
}