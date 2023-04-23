function init() {
    window.canvas = document.querySelector("canvas");
    window.ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;

    onresize();

    const MAX_X = 32;
    const MAX_Z = Math.ceil(innerHeight / (innerWidth / 3) * MAX_X);
    TileManager.generate(MAX_X, MAX_Z);

    render(ctx);
}

window.onresize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}

function render() {
    requestAnimationFrame(render);
    TileManager.getTiles().forEach(x => x.render(ctx));
}