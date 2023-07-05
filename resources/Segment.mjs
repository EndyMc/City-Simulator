import TileManager from "./Drawable.mjs";

export class Segment {
    #canvas = document.createElement("canvas");
    #image;

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.updateImage();
    }

    updateImage() {
        var tiles = TileManager.getTiles();

        var width  = 16;//Math.min(2 ** 15 - 1, maxX - minX);
        var height = 16;//Math.min(2 ** 15 - 1, maxY - minY);
        
        tiles = tiles.filter(t => {
            return t.y == this.y && (t.x >= this.x && t.x <= this.x + width) && (t.z >= this.z && t.z <= this.z + height)
        });
        
        var positions = tiles.map(t => t.getScreenPosition(true));
        var minX = Math.min(...positions.map(t => t.x));
        var maxX = Math.max(...positions.map(t => t.x));
        var minY = Math.min(...positions.map(t => t.y));
        var maxY = Math.max(...positions.map(t => t.y));

        width = maxX - minX;
        height = maxY - minY;
                
        this.#canvas.width = width;
        this.#canvas.height = height;

        var ctx = this.#canvas.getContext("2d");

        tiles.forEach(t => t.render(ctx, true));
        
        this.#canvas.toBlob(async b => {
            this.#image = await createImageBitmap(b);
        });
    }

    getImage() {
        return this.#image;
    }

    /**
     * @type {Segment[]}
     */
    static SEGMENTS = [];
}

window.seg = Segment;