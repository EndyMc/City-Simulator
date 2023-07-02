import { Drawable } from "./Drawable.mjs";

export default class Images {
    static Tiles = {
        GRASS: "images/grass.png",
        DIRT: "images/dirt.png",
        WATER: "images/water_no_border.png"
    }

    static Houses = {
        VARIANT_1: "images/house.png"
    }

    static Boats = {
        VARIANT_1: "images/boat_1.png"
    }

    static #imageCache = {};
    static #upscale = 10;
    static async getImage(src) {
        if (Images.cacheContains(src)) return Images.getImageFromCache(src);
        
        return new Promise((resolve) => {
            var size = new Drawable().size;
            var image = new Image();

            image.onload = async () => {
                image = await createImageBitmap(image, { resizeHeight: size / 2 * Images.#upscale, resizeWidth: size / Math.sqrt(3) * Images.#upscale, resizeQuality: "pixelated" });

                Images.#imageCache[src] = image;
                resolve(image);
            }

            image.src = src;
        });
    }

    static get textures() {
        return [ ...Object.values(Images.Tiles), ...Object.values(Images.Houses), ...Object.values(Images.Boats) ];
    }

    static getImageFromCache(src) {
        return Images.#imageCache[src];
    }

    static cacheContains(src) {
        return Images.getImageFromCache(src) != undefined;
    }
}