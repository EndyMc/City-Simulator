import Images from "./Images.js";
import TileManager from "./Drawable.js";
import { Camera } from "./World.js";

window.init = async () => {
    window.canvas = document.querySelector("canvas");
    
    onresize();
    
    drawText("Loading Textures");
    
    var textures = [ ...Object.values(Images.Tiles), Object.values(Images.Houses) ];
    for (var i = 0; i < textures.length; i++) {
        var texture = textures[i];
        
        drawText("Loading Texture: " + (i+1) + "/" + (textures.length));
        console.log("Loading Textures; %s/%s", i+1, textures.length);
        await Images.getImage(texture);
    }

    drawText("Generating World");
    requestIdleCallback(async () => {
        await TileManager.generate();
        Camera.moveTo(-Infinity, -Infinity);

        render();
    }, { timeout: 100 });
}

var textQueue = [];
export function drawText(text) {
    textQueue.push(text);

    var texts = new Array(...textQueue);
    var ctx = window.canvas.getContext("2d");
    ctx.font = "5vh Arial";
    textQueue = [];
    texts.forEach(text => {
        var w = ctx.measureText(text).width;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        ctx.fillText(text, (innerWidth - w) / 2, innerHeight / 2);
    });
}

window.onresize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}

window.keys = {};
window.onkeydown = (evt) => {
    window.keys[evt.key] = true;
}

window.onkeyup = (evt) => {
    window.keys[evt.key] = undefined;
}

class Cursor {
    static #lastKnownPosition = { x: 0, y: 0 };
    static #selectedTile;

    static _onmousemove(evt) {
        Cursor.#lastKnownPosition = { x: evt.clientX, y: evt.clientY };
        Cursor.updateSelectedTile();
    }
    
    /**
     * @returns {Tile}
     */
    static getSelectedTile() {
        return Cursor.#selectedTile;
    }
    
    static updateSelectedTile() {
        Cursor.#selectedTile = TileManager.getHighlightedTile(Cursor.#lastKnownPosition.x, Cursor.#lastKnownPosition.y);
        if (Cursor.#selectedTile != undefined) {
            Cursor.#selectedTile.selected = true;
            console.log(Cursor.#selectedTile);
        }
    }

    /**
     * @returns {{x: number, y: number}}
     */
    static getPosition() {
        return Cursor.#lastKnownPosition;
    }
}

window.onmousemove = Cursor._onmousemove;

var previousTimestamp = performance.now();
function render(timestamp = performance.now()) {
    /**
     * @type {CanvasRenderingContext2D}
     */
    var ctx = window.canvas.getContext("2d");
    var delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    requestAnimationFrame(render);
    
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.font = "5vh Arial";
    
    var velocity = 1/2 * delta;
    if (window.keys["w"] != undefined) {
        Camera.moveBy(0, -velocity);
        Cursor.updateSelectedTile();
    } if (window.keys["a"] != undefined) {
        Camera.moveBy(-velocity, 0);
        Cursor.updateSelectedTile();
    } if (window.keys["s"] != undefined) {
        Camera.moveBy(0, velocity);
        Cursor.updateSelectedTile();
    } if (window.keys["d"] != undefined) {
        Camera.moveBy(velocity, 0);
        Cursor.updateSelectedTile();
    }

    TileManager.getTiles().forEach(x => x.render(ctx));
    Debugging.render(ctx);
}

class Debugging {
    static #frames = [];
    static render(ctx) {
        Debugging.#frames = Debugging.#frames.filter(x => x >= performance.now() - 1000);
        Debugging.#frames.push(performance.now());

        ctx.fillText("FPS: " + Debugging.#frames.length, 0.01 * innerHeight, 0.045 * innerHeight);
    }
}