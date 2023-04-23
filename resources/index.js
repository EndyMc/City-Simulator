function init() {
    window.canvas = document.querySelector("canvas");
    window.ctx = canvas.getContext("2d");

    onresize();

    const MAX_X = 64;
    const MAX_Z = 64;
    TileManager.generate(MAX_X, MAX_Z);

    render(ctx);
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
function render(timestamp) {
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