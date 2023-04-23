function init() {
    window.canvas = document.querySelector("canvas");
    window.ctx = canvas.getContext("2d");

    onresize();

    render(ctx);
}

window.onresize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const MAX_X = 16;
    const MAX_Y = Math.ceil(innerHeight / (innerWidth / 2) * MAX_X);

    TileManager.clear();
    for (var y = -1; y < MAX_Y; y += 0.5) {
        for (var x = -1; x < MAX_X; x += 0.5) {
            if ((x % 1 != 0 && y % 1 == 0) || (x % 1 == 0 && y % 1 != 0)) continue;
            TileManager.getTiles().push(new Tile(x, y));
        }
    }
}

function render() {
    requestAnimationFrame(render);
    TileManager.getTiles().forEach(x => x.render(ctx));
}