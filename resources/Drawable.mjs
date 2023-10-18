import World, { Camera } from "./World.mjs";
import Images from "./Images.mjs";
import { Cursor } from "./index.mjs";
import { LoadingMenu } from "./Menu.mjs";
import UI from "./UI.mjs";
import { Segment } from "./Segment.mjs";
import { LayerManager } from "./Layer.mjs";

export class Drawable {
    #width = this.size;
    #height = this.size;

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
        this.#width = this.size;
    }
    
    set height(_) {
        this.#height = this.size;
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
            this.#image = Images.getImageFromCache(this.imagePath, this.width, this.height);
        }
        
        return this.#image;
    }

    set image(value) {
        this.#image = value;
    }

    static getHash(x, z) {
        return "x" + Math.round(10*x) + "z" + Math.round(10*z);
    }

    /**
     * Render this tile
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx, offset) {
        if (this.image == undefined) return;
        
        var position = this.getScreenPosition(offset != undefined, offset != undefined ? { width: offset.width, height: offset.height } : undefined);
        if (position == undefined && offset == undefined) return;

        if (offset != undefined) {
            this.#width = offset.width;
            this.#height = offset.height;
        }

        var x = position.x - (offset == undefined ? 0 : offset.x);
        var y = position.y - (offset == undefined ? 0 : offset.y);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.image , x, y, this.width, this.height);

        if (offset == undefined && this.selected) {
            var hasTileAbove = TileManager.getTile(this.x, this.y + 1, this.z) instanceof Building;

            
            // Shop item
            if (UI.shownItem != undefined) {
                if (hasTileAbove) {
                    // Hover effect
                    ctx.drawImage(Images.getImageFromCache(Images.Internal.RED_HOVER), position.x, position.y, this.width, this.height / 1.5);

                } else {
                    // Hover effect
                    ctx.drawImage(Images.getImageFromCache(Images.Internal.WHITE_HOVER), position.x, position.y, this.width, this.height / 1.5);

                    var item = new Drawable(this.x, this.y + 1, this.z);
                    item.image = UI.shownItem.image;
    
                    ctx.save();
                        ctx.globalAlpha = 0.8;
                        item.render(ctx);
                    ctx.restore();
                }
            }
        }

        if (offset != undefined) {
            // Return these values to their rightful state
            this.width = 0;
            this.height = 0;
        }
        
        return;

        var { x, y } = this.getMiddlePoint();
        var bounds = this.getBoundingBox();
        var outlineColor = "black";

        if (!(this.type == "WATER" || this.type == "DEEP_WATER")) {
//            var c = (this.y - World.LOWEST_POINT)/(World.HIGHEST_POINT-World.LOWEST_POINT) * 255;
            ctx.save();
//                ctx.fillStyle = "rgb(" + c + "," + c + "," + c + ")";
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 0.005 * 1/2 * clientHeight * Camera.zoom;
                
                // Left Side
                ctx.beginPath();
                    ctx.moveTo(position.x, y);
                    ctx.lineTo(position.x, position.y + this.width / 1.5);
                ctx.stroke();

                // Right Side
                ctx.beginPath();
                    ctx.moveTo(position.x + this.width, y);
                    ctx.lineTo(position.x + this.width, position.y + this.width / 1.5);
                    ctx.moveTo(x, position.y + this.height);
                    ctx.lineTo(x, position.y + this.width / 1.5);
                ctx.stroke();

                // Top
                ctx.beginPath();
                    ctx.moveTo(position.x, y);
                    ctx.lineTo(x, position.y);
                    ctx.lineTo(bounds.x2, y);
                    ctx.lineTo(x, position.y + this.width / 1.5);
                ctx.closePath();
                ctx.stroke();

//                ctx.beginPath();
//                    ctx.moveTo(x, position.y + this.height);
//                    ctx.lineTo(position.x + this.width, position.y + this.width / 1.5);
//                    ctx.lineTo(position.x + this.width, y);
//                    ctx.lineTo(x, position.y + this.width / 1.5);
//                    ctx.lineTo(position.x, y);
//                    ctx.lineTo(position.x, position.y + this.width / 1.5);
//                ctx.closePath();
//                ctx.fill();
//                ctx.stroke();
            ctx.restore();
        } else {
            if (TileManager.getTile(this.x - 0.5, Math.floor(this.y + 1), this.z - 0.5) != undefined) {
                ctx.save();
                    ctx.strokeStyle = outlineColor;
                    ctx.lineWidth = 0.005 * 1/2 * clientHeight * Camera.zoom;
                    ctx.beginPath();
                        ctx.moveTo(x, position.y);
                        ctx.lineTo(position.x, y);
                    ctx.stroke();
                ctx.restore();
            }

            if (TileManager.getTile(this.x + 0.5, Math.floor(this.y + 1), this.z - 0.5) != undefined) {
                ctx.save();
                    ctx.strokeStyle = outlineColor;
                    ctx.lineWidth = 0.005 * 1/2 * clientHeight * Camera.zoom;
                    ctx.beginPath();
                        ctx.moveTo(x, position.y);
                        ctx.lineTo(position.x + this.width, y);
                    ctx.stroke();
                ctx.restore();
            }
        }
    }

    /**
     * @returns {{x: number, y: number}}
     */
    getScreenPosition(ignoreOutOfBounds = false, size = {}) {
        size.width = size.width || this.width;
        size.height = size.height || this.height;

        var cameraPosition = Camera.getPosition();

        var x = this.x * size.width - (ignoreOutOfBounds ? 0 : cameraPosition.x);
        if (!ignoreOutOfBounds && (x + size.width < 0 || x > clientWidth)) return;

        var y = this.z * size.height * (2/3) - this.y * size.height / 3 - (ignoreOutOfBounds ? 0 : cameraPosition.z);
        if (!ignoreOutOfBounds && (y + size.height < 0 || y > clientHeight)) return;

        return { x, y };
    }

    get isometricBoundingBox() {
        var { x, y } = this.getMiddlePoint();
        var position = this.getScreenPosition();
        var bounds = this.getBoundingBox();

        return {
            up: { x, y: bounds.y1 },
            down: { x, y: position.y + this.width / 1.5 },
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
        if (!right) return false;

        var left = intersectHorizontal({ k: 0, m: invertedCursorPosition.y }, { m: 0, k: -sides.south_west }, { x: bounds.left.x, y: 0 }, { x: bounds.down.x, y: bounds.left.y }) || intersectHorizontal({ k: 0, m: invertedCursorPosition.y }, { m: bounds.down.y, k: -sides.north_west }, { x: bounds.left.x, y: bounds.left.y }, { x: bounds.up.x, y: bounds.down.y });
        if (!left) return false;

        var up = intersectVertical(invertedCursorPosition.x, { m: bounds.down.y, k: -sides.north_west }, { x: bounds.left.x, y: bounds.left.y }, { x: bounds.down.x, y: bounds.down.y }) || intersectVertical(invertedCursorPosition.x, { m: bounds.down.y, k: -sides.north_east }, { x: bounds.up.x, y: bounds.right.y }, { x: bounds.right.x, y: bounds.down.y });
        if (!up) return false;

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
            y: (position?.y + this.width / 1.5 / 2) || -1
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

export class Building extends Drawable {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y, z, imagePath, type = "") {
        super(x, y, z, imagePath, type);
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

    static addTiles(...tiles) {
        TileManager.#tiles.push(...tiles);

        TileManager.#tiles.sort((a, b) => (a.y) - (b.y));
        TileManager.#tiles.sort((a, b) => (a.z) - (b.z));
        
        tiles.forEach(t => {
            var hash = t.hash;
            if (TileManager.#tileHashes[hash]?.includes(t)) return;

            if (TileManager.#tileHashes[hash] == undefined) {
                TileManager.#tileHashes[hash] = [];
            }
            TileManager.#tileHashes[hash].push(t);
        });

    }

    /**
     * @returns {Tile[]}
     */
    static getTiles() {
        return TileManager.#tiles;
    }

    static getTile(x, y, z) {
        return TileManager.#tileHashes[Drawable.getHash(x, z)]?.find(t => t.y == y);
    }

    static getTileHashes() {
        return TileManager.#tileHashes;
    }

    static async generate(tiles = [], startX = 0 - 1, startZ = 0 - World.WORLD_HEIGHT, endX = World.MAX_X + 1, endZ = World.MAX_Z + World.WORLD_HEIGHT, connectedTiles = []) {
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

        for (var z = startZ; z < endZ; z += Segment.HEIGHT * 2 + 1) {
            for (var x = startX; x < endX; x += Segment.WIDTH * 2 + 1) {
                Segment.SEGMENTS.add(new Segment(x, z));
            }
            Segment.SEGMENTS.add(new Segment(x, z));
        }

//        Segment.SEGMENTS.sort((a, b) => a.z - b.z);

        LayerManager.shouldRenderLayer("world");

        LoadingMenu.visible = false;
        UI.visible = true;
        
        Camera.moveBy(0, 0);
        Camera.generatingTerrain = false;
    }

    static unload(startX, startZ, endX, endZ) {
        
    }

    static getHighlightedTile(screenX, screenY) {
        // Get candidates for which tiles are the most likely to be the one the user hovers
        var segments = Segment.SEGMENTS.filter(s => {
            var bounds = s.getBounds();
            return screenX >= bounds.x1 && screenY >= bounds.y1 && screenX <= bounds.x2 && screenY <= bounds.y2;
        });

        if (segments.length == 0) return Cursor.getSelectedTile();

        var candidates = [];
        segments.forEach(s => {
            var list = s.getTiles().filter(tile => {
                if ((tile instanceof Building && !tile.stackable) || tile instanceof Vehicle) {
                    // Don't check houses and other such entities
                    return false;
                }
                
                tile.selected = false;

                return tile.contains(screenX, screenY);
            });

            list.forEach(val => {
                candidates.push(val);
            });
        });

        candidates
        // Sort by y-coordinate
        .sort((a, b) => b.y - a.y)
            
        // Sort by z-coordinate
        .sort((a, b) => b.z - a.z);

        // Return to most likely one
        return candidates?.[0] || Cursor.getSelectedTile();
    }
}
window.tm = TileManager;

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