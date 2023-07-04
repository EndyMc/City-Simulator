import { Drawable } from "./Drawable.mjs";

export default class Images {
    static Tiles = {
        GRASS: "images/grass.png",
        DIRT: "images/dirt.png",
        WATER: "images/water_no_border.png",
        DEEP_WATER: "images/deep_water.png",
        SAND: "images/sand.png"
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
            var image = new Image();
            
            image.onload = async () => {
                image = await scalePixelated(image, image.width * Images.#upscale, image.height * Images.#upscale);
                
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

async function scalePixelated(image, width, height) {
    return new Promise(resolve => {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        
        canvas.width = width;
        canvas.height = height;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, width, height);
        
        canvas.toBlob(async b => resolve(await createImageBitmap(b)));
    });
}

window.images = Images;