import TileManager, { Drawable, Tile } from "./Drawable.mjs";
import Images from "./Images.mjs";
import { LinkedList } from "./LinkedList.mjs";
import { Camera } from "./World.mjs";

export class Segment {
    static WIDTH = 5;
    static HEIGHT = 0;

    TILE_WIDTH = 64;
    TILE_HEIGHT = 48;

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

    #width = 0;
    #height = 0;

    get width() {
        return this.#width * Camera.zoom;
    }

    set width(value) {
        var xPositions = this.#tiles.map(t => t.getScreenPosition(true).x);

        var minX = Math.min(...xPositions);
        var maxX = Math.max(...xPositions) + this.#left.width;

        console.log(maxX - minX, maxX, minX);
        
        this.#width = (maxX - minX) / Camera.zoom;
    }
    
    set height(value) {
        var yPositions = this.#tiles.map(t => t.getScreenPosition(true).y);

        var minY = Math.min(...yPositions);
        var maxY = Math.max(...yPositions) + this.#upper.height;

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

        this.width = 0;
        this.height = 0;
    }

    addTile(tile) {
        // Remove the old building
        var duplicateIndex = this.#tiles.findIndex(t => t.x == tile.x && t.z == tile.z && t.y == tile.y);
        if (duplicateIndex != -1) {
            this.#tiles.splice(duplicateIndex, 1);
        }
        
        // Add this new tile in the correct location
        this.#tiles.push(tile);
        
        this.#tiles
        .sort((a, b) => (a.y) - (b.y))
        .sort((a, b) => (a.z) - (b.z));
        
        // Do the same as in the constructor...
        this.calculateDimensions();
        this.updateImage();

        this.width = 0;
        this.height = 0;
    }

    calculateDimensions() {
        var positions = this.#tiles.map(t => t.getScreenPosition(true, { width: this.TILE_WIDTH, height: this.TILE_HEIGHT }));

        var xPositions = positions.map(t => t.x);
        var yPositions = positions.map(t => t.y);

        var minX = Math.min(...xPositions);
        var minY = Math.min(...yPositions);

        var maxX = Math.max(...xPositions) + this.TILE_WIDTH;
        var maxY = Math.max(...yPositions) + this.TILE_HEIGHT;

        this.#left = this.#tiles[positions.findIndex(t => t.x == minX)];
        this.#upper = this.#tiles[positions.findIndex(t => t.y == minY)];

        this.#width = maxX - minX;
        this.#height = maxY - minY;

        this.#canvas.width = this.#width;
        this.#canvas.height = this.#height;
    }

    updateImage() {
        if (this.#tiles.length == 0) {
            throw "Invalid amount of tiles";
        }

        var ctx = this.#canvas.getContext("2d");

        var offset = { width: this.TILE_WIDTH, height: this.TILE_HEIGHT, ...this.getScreenPosition(true, { width: this.TILE_WIDTH, height: this.TILE_HEIGHT }) };
        this.#tiles.forEach(t => t.render(ctx, offset));
    }

    getImage() {
        return this.#canvas;
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

    getScreenPosition(ignoreOutOfBounds, size) {
        var x = this.#left?.getScreenPosition(ignoreOutOfBounds, size)?.x;
        if (x == undefined) return;

        var y = this.#upper?.getScreenPosition(ignoreOutOfBounds, size)?.y;
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
     * @type {LinkedList}
     */
    static SEGMENTS = new LinkedList();
}

window.seg = Segment;