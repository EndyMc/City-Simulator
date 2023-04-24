import World, { Camera } from "./World.js";
import Images from "./Images.js";

export class House {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y, z, type = "VARIANT_1") {
        this.type = type;
        this.imagePath = Images.Houses[type];
        
        this.size = Math.floor(innerWidth / 16);

        this.width = this.size / Math.sqrt(3);
        this.height = this.size / 2;

        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Render this house
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        if (!Images.cacheContains(this.imagePath)) return;

        var x = this.x * this.width - Camera.getPosition().x;
        if (x + this.width < 0 || x > innerWidth) return;

        var y = this.z * this.height * (2/3) - this.y * this.size / 6 - Camera.getPosition().z;
        if (y + this.height < 0 || y > innerHeight) return;

        ctx.drawImage(Images.getImageFromCache(this.imagePath), x, y);
    }
}

export default class HouseManager {
    static #houses = [];

    /**
     * @returns {House[]} A copy of the houses array
     */
    static getHouses() {
        return HouseManager.#houses;
    }

    static generate() {
        HouseManager.#houses = World.generate();
    }

    static clear() {
        HouseManager.#houses = [];
    }
}