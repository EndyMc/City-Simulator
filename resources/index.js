import Images from "./Images.js";
import TileManager from "./Drawable.js";
import { Camera } from "./World.js";
import { LayerManager } from "./Layer.js";

window.init = async () => {
    onresize();

    LayerManager.layers.world.onRender = (ctx) => {
        TileManager.getTiles().forEach(x => x.render(ctx));
    };

    LayerManager.layers.ui.onRender = (ctx) => {
        Debugging.render(ctx);
    };
    
    drawText("Loading Textures");
    
    var textures = Images.textures;
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

export function drawText(text) {
    var ctx = document.getElementById("ui-layer").getContext("2d");
    var w = ctx.measureText(text).width;

    ctx.font = "5vh Arial";
    ctx.clearRect(0, 0, clientWidth, clientHeight);
    ctx.fillText(text, (clientWidth - w) / 2, clientHeight / 2);
}

window.onresize = () => {
    window.clientWidth = innerWidth;
    window.clientHeight = innerHeight;

    TileManager.getTiles().forEach(tile => {
        // Update width and height
        tile.width = 0;
        tile.height = 0;
    });

    Object.values(LayerManager.layers).forEach(layer => {
        layer.canvas.width = clientWidth;
        layer.canvas.height = clientHeight;
        
        // Canvases get cleared when resized
        layer.shouldRender = true;
    });
}

window.keys = {};
window.onkeydown = (evt) => {
    window.keys[evt.key.toLowerCase()] = true;
}

window.onkeyup = (evt) => {
    window.keys[evt.key.toLowerCase()] = undefined;
    if (evt.key == "+") {
        Camera.zoomIn();
    } else if (evt.key == "-") {
        Camera.zoomOut();
    }
}

export class Cursor {
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
            LayerManager.shouldRenderLayer("world");
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
window.onwheel = (evt) => {
    if (evt.deltaY < 0) {
        Camera.zoomIn();
    } else if (evt.deltaY > 0) {
        Camera.zoomOut();
    }
}

var previousTimestamp = performance.now();
function render(timestamp = performance.now()) {
    requestAnimationFrame(render);

    var delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
    
    var velocity = 1/2 * delta;
    if (window.keys["shift"] != undefined) {
        velocity = 3/2 * delta;
    }

    if (window.keys["w"] != undefined) {
        Camera.moveBy(0, -velocity);
    } if (window.keys["a"] != undefined) {
        Camera.moveBy(-velocity, 0);
    } if (window.keys["s"] != undefined) {
        Camera.moveBy(0, velocity);
    } if (window.keys["d"] != undefined) {
        Camera.moveBy(velocity, 0);
    }

    if (Debugging.enabled) LayerManager.shouldRenderLayer("ui");
    LayerManager.render();
    LayerManager.layersRendered();
}

class Debugging {
    static #frames = [];
    static enabled = true;

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    static render(ctx) {
        Debugging.#frames = Debugging.#frames.filter(x => x >= performance.now() - 1000);
        Debugging.#frames.push(performance.now());

        ctx.save();
            ctx.font = "5vh Arial";
            ctx.fillStyle = "black";
            ctx.fillText("FPS: " + Debugging.#frames.length, 0.01 * clientHeight, 0.045 * clientHeight);
        ctx.restore();
    }
}