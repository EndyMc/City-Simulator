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

        this.image = new Image(32, 48);
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
        var size = Math.floor(innerWidth / 16);

        var width = size / Math.sqrt(3);
        var height = size / 2;

        var x = this.x * size / Math.sqrt(3) - Camera.getPosition().x;
        if (x + width < 0 || x > innerWidth) return;

        var y = this.z*size / 3 - this.y*size / 6 - Camera.getPosition().z;
        if (y + height < 0 || y > innerHeight) return;

        ctx.drawImage(this.image, x, y, width, height);
    }
}

class TileManager {
    static #tiles = [];

    /**
     * @returns {Tile[]} A copy of the tiles array
     */
    static getTiles() {
        return TileManager.#tiles;
    }

    static generate(width, height) {
        TileManager.#tiles = World.generate(width, height);
    }

    static clear() {
        TileManager.#tiles = [];
    }
}