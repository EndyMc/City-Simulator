import TileManager, { Drawable, Tile } from "./Drawable.mjs";
import Images from "./Images.mjs";
import { Camera } from "./World.mjs";

export class Segment {
    static WIDTH = 5;
    static HEIGHT = 0;

    /**
     * @type {Tile}
     */
    #upper;

    /**
     * @type {Tile}
     */
    #left;

    /**
     * @type {Tile[]}
     */
    #tiles = [];

    #canvas = document.createElement("canvas");
    #image;

    #width = 0;
    #height = 0;

    get width() {
        return this.#width * Camera.zoom;
    }

    set width(value) {
        var xPositions = this.#tiles.map(t => t.getScreenPosition(true).x);

        var minX = Math.min(...xPositions);
        var maxX = Math.max(...xPositions) + new Drawable().width;

        
        this.#width = (maxX - minX) / Camera.zoom;
    }
    
    set height(value) {
        var yPositions = this.#tiles.map(t => t.getScreenPosition(true).y);

        var minY = Math.min(...yPositions);
        var maxY = Math.max(...yPositions) + new Drawable().height;

        this.#height = (maxY - minY) / Camera.zoom;
    }

    get height() {
        return this.#height * Camera.zoom;
    }

    constructor(x, z) {
        this.x = x;
        this.z = z;

        var hashes = TileManager.getTileHashes();

        for (var x = -Segment.WIDTH; x <= Segment.WIDTH; x += 0.5) {
            for (var z = -Segment.HEIGHT; z <= Segment.HEIGHT; z += 0.5) {
                if ((x + z) % 1 != 0) continue;
                this.#tiles.push(...(hashes[Drawable.getHash(this.x + x, this.z + z)] || []));
            }
        }

        var z = Segment.HEIGHT + 0.5;
        for (var x = -(Segment.WIDTH + 0.5); x <= Segment.WIDTH + 0.5; x++ ) {
            this.#tiles.push(...(hashes[Drawable.getHash(this.x + x, this.z + z)] || []));
        }

        this.#tiles = this.#tiles.filter(t => t != undefined)
            .sort((a, b) => (a.y) - (b.y))
            .sort((a, b) => (a.z) - (b.z));

        this.calculateDimensions();
        this.updateImage();
    }

    calculateDimensions() {
        var positions = this.#tiles.map(t => t.getScreenPosition(true));

        var xPositions = positions.map(t => t.x);
        var yPositions = positions.map(t => t.y);

        var minX = Math.min(...xPositions);
        var minY = Math.min(...yPositions);

        this.#left = this.#tiles[positions.findIndex(t => t.x == minX)];
        this.#upper = this.#tiles[positions.findIndex(t => t.y == minY)];

        this.width = 0;
        this.height = 0;

        this.#canvas.width = this.#width;
        this.#canvas.height = this.#height;
    }

    updateImage() {
        var image = undefined;//Images.getImageFromCache(this.getId());
        if (image != undefined) {
            this.#image = image;
            return;
        } else if (this.#tiles.length == 0) {
            throw "Invalid amount of tiles";
        }

        var ctx = this.#canvas.getContext("2d");

        this.#tiles.forEach(t => t.render(ctx, this.getScreenPosition(true)));
        
        this.#image = this.#canvas;

//        Images.addImage(this.#image, this.getId());
    }

    getImage() {
        return this.#image;
    }

    /**
     * @returns {{ x1: number, y1: number, x2: number, y2: number }}
     */
    getBounds() {
        var position = this.getScreenPosition(true);
        if (position == undefined) throw "Position out of bounds";

        var cameraPosition = Camera.getPosition();
        
        return {
            x1: position.x - cameraPosition.x,
            y1: position.y - cameraPosition.z,
            x2: position.x + this.width - cameraPosition.x,
            y2: position.y + this.height - cameraPosition.z
        }
    }

    getScreenPosition(ignoreOutOfBounds) {
        var x = this.#left?.getScreenPosition(ignoreOutOfBounds)?.x;
        if (x == undefined) return;

        var y = this.#upper?.getScreenPosition(ignoreOutOfBounds)?.y;
        if (y == undefined) return;

        return { x, y };
    }

    getTiles() {
        return this.#tiles;
    }

    getId() {
        return "internal:segment?" + this.#tiles.map(t => t.type + "|" + t.y).join();
    }

    /**
     * @type {Segment[]}
     */
    static SEGMENTS = [];
}

window.seg = Segment;