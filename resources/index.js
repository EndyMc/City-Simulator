import Images from "./Images.js";
import TileManager from "./Tile.js";
import { Camera } from "./World.js";

window.init = async () => {
    window.canvas = document.querySelector("canvas");
    var ctx = window.canvas.getContext("2d");
    
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
    await TileManager.generate();

    render();
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

var previousTimestamp = performance.now();
function render(timestamp = performance.now()) {
    var ctx = window.canvas.getContext("2d");
    var delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    requestAnimationFrame(render);
    
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.font = "5vh Arial";
    
    var velocity = 1/2 * delta;
    if (window.keys["w"] != undefined) {
        Camera.moveBy(0, -velocity);
    } if (window.keys["a"] != undefined) {
        Camera.moveBy(-velocity, 0);
    } if (window.keys["s"] != undefined) {
        Camera.moveBy(0, velocity);
    } if (window.keys["d"] != undefined) {
        Camera.moveBy(velocity, 0);
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