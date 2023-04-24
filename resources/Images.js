export default class Images {
    static Tiles = {
        GRASS: "/images/grass.png",
        DIRT: "/images/dirt.png",
        WATER: "/images/water_no_border.png"
    }

    static Houses = {
        VARIANT_1: "/images/house.png"
    }

    static #imageCache = {};
    static async getImage(src) {
        return new Promise((resolve) => {
            if (Images.#imageCache[src] != undefined) resolve(Images.#imageCache[src]);

            var image = new Image();
            var size = Math.floor(innerWidth / 16);
            image.src = src;

            image.onload = async () => {
                image = await createImageBitmap(image, { resizeHeight: size / 2, resizeWidth: size / Math.sqrt(3) });
                Images.#imageCache[src] = image;
                resolve(image);
            }
        });
    }

    static getImageFromCache(src) {
        return Images.#imageCache[src];
    }

    static cacheContains(src) {
        return Images.#imageCache[src] != undefined;
    }
}