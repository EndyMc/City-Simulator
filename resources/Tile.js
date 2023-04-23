class Tile {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.imagePath = Math.random() > 0.5 ? "/images/grass.png" : "/images/picture.png";

        this.image = new Image();
        this.image.src = this.imagePath;

        this.x = x;
        this.y = y;
    }

    /**
     * Render this tile
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        var size = Math.floor(innerWidth / 16);
        ctx.drawImage(this.image, this.x * size, this.y*size / 2, size, size / 2);
    }
}

class TileManager {
    static #tiles = [];

    /**
     * @returns {Tile[]}
     */
    static getTiles() {
        return TileManager.#tiles;
    }

    static clear() {
        TileManager.#tiles = [];
    }
}