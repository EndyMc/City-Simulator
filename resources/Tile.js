class Tile {
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

        this.image = new Image();
        this.image.src = this.imagePath;

        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Render this tile
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        var size = Math.floor(innerWidth / 32);
        ctx.drawImage(this.image, this.x * size, this.z*size / (1.5 ** 2) - this.y*size/6, size, size / 1.5);
    }
}

class TileManager {
    static #tiles = [];

    /**
     * @returns {Tile[]} A copy of the tiles array
     */
    static getTiles() {
        return new Array(...TileManager.#tiles);
    }

    static generate(width, height) {
        TileManager.#tiles = World.generate(width, height);
    }

    static clear() {
        TileManager.#tiles = [];
    }
}