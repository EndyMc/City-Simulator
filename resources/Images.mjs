export default class Images {
    static Internal = {
        RED_HOVER: "internal:red_hover",
        WHITE_HOVER: "internal:white_hover"
    }

    static Tiles = {
        GRASS: "images/grass.png",
        DIRT: "images/dirt_no_border.png",
        WATER: "images/water_no_border.png",
        DEEP_WATER: "images/deep_water.png",
        SAND: "images/sand.png"
    }

    static Buildings = {
        SMALL_HOUSE: "images/house.png",
        WALL: "images/wall.png",
        PATH: "images/straight_dirt_path.png"
    }

    static UI = {
        REMOVE: "images/remove.png"
    }

    static Boats = {
        VARIANT_1: "images/boat_1.png"
    }

    static get cache() {
        return Images.#imageCache;
    }

    static addImage(image, src) {
        Images.#imageCache[src] = Images.#imageCache[src] || {};
        Images.#imageCache[src][0 + ":" + 0] = Images.#imageCache[src][0 + ":" + 0] || image;
        Images.#imageCache[src][image.width + ":" + image.height] = image;
    }

    static getInternalImage(src) {
        if (!src.startsWith("internal:")) throw "Trying to fetch non-internal image";
        return self[src]();
    }

    static #imageCache = {};
    static getImage(src, width = 0, height = 0) {
        width = Math.round(width);
        height = Math.round(height);

        if (src == undefined) console.trace();

        if (Images.cacheContains(src, width, height)) return Images.getImageFromCache(src, width, height);
        
        if (src.startsWith("internal:")) {
            var image = Images.getInternalImage(src);
            Images.addImage(image, src);
            return image;
        }

        if (Images.cacheContains(src, 0, 0)) {
            var image = Images.getImageFromCache(src, 0, 0);

            image = scalePixelated(image, width, height);

            Images.addImage(image, src);

            return image;
        }

        throw "Image not generated";
    }

    static get textures() {
        return [ ...Object.values(Images.Tiles), ...Object.values(Images.Buildings), ...Object.values(Images.Boats), ...Object.values(Images.Internal), ...Object.values(Images.UI) ];
    }

    static getImageFromCache(src, width = 0, height = 0) {
        width = Math.round(width);
        height = Math.round(height);

        return Images.#imageCache[src]?.[width + ":" + height];
    }

    static cacheContains(src, width = 0, height = 0) {
        width = Math.round(width);
        height = Math.round(height);

        return Images.getImageFromCache(src, width, height) != undefined;
    }

    static getHover() {
        return Images.getImageFromCache("internal:hover");
    }
}

function scalePixelated(image, width, height) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    width = Math.round(width);
    height = Math.round(height);
    
    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, width, height);
    
    return canvas;
}



self[Images.Internal.RED_HOVER] = () => {
    var canvas = document.createElement("canvas");

    canvas.width = 64;
    canvas.height = 48;

    var ctx = canvas.getContext("2d");

    var x = canvas.width / 2;
    var y = canvas.height / 2;

    ctx.fillStyle = "red";
    ctx.globalAlpha = 1;
    ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(x, 0);
        ctx.lineTo(canvas.width, y);
        ctx.lineTo(x, canvas.height);
    ctx.closePath();
    ctx.fill();

    return canvas;
}

self[Images.Internal.WHITE_HOVER]   = () => {
    var canvas = document.createElement("canvas");

    canvas.width = 64;
    canvas.height = 48;

    var ctx = canvas.getContext("2d");

    var x = canvas.width / 2;
    var y = canvas.height / 2;

    ctx.fillStyle = "white";
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(x, 0);
        ctx.lineTo(canvas.width, y);
        ctx.lineTo(x, canvas.height);
    ctx.closePath();
    ctx.fill();

    return canvas;
}

window.images = Images;