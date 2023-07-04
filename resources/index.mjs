import Images from "./Images.mjs";
import TileManager from "./Drawable.mjs";
import { Camera } from "./World.mjs";
import { LayerManager } from "./Layer.mjs";
import UI, { ShopItem } from "./UI.mjs";
import { LoadingMenu } from "./Menu.mjs";

window.init = async () => {
    onresize();
    navigator.storage.persist();

    LoadingMenu.visible = true;
    UI.visible = false;

    LayerManager.layers.world.onRender = (ctx) => {
        TileManager.getTiles().forEach(x => x.render(ctx));
    };

    LayerManager.layers.ui.onRender = (ctx) => {
        LoadingMenu.render(ctx);
        UI.render(ctx);
        if (Debugging.enabled) Debugging.render(ctx);
    };

    LayerManager.layers.ui.onClick = (x, y) => {
        if (UI.onClick(x, y)) {
            LayerManager.shouldRenderLayer("ui");
            return true;
        }

        return false;
    };

    LayerManager.layers.ui.onHover = (x, y) => {
        Cursor.lastKnownPosition = { x, y };
        LayerManager.shouldRenderLayer("ui");

        if (UI.getBoxes().some(t => t.contains(x, y))) {
            Cursor.deselectTile();
//            UI.onHover(x, y);
            return true;
        }

        return false;
    }

    LayerManager.layers.world.onHover = (x, y) => {
        Cursor.lastKnownPosition = { x, y };
        Cursor.updateSelectedTile();

        return true;
    }

    LoadingMenu.loadingText = "Loading Textures";
    
    var textures = Images.textures;
    for (var i = 0; i < textures.length; i++) {
        var texture = textures[i];
        
        LoadingMenu.currentProcessText = (i + 1) + "/" + textures.length;
        console.log("Loading Textures; %s/%s", i+1, textures.length);

        await Images.getImage(texture);
    }

    LoadingMenu.loadingText = "Loading Items";

    var categories = await (await fetch("data/items.json")).json();
    var len = Object.keys(categories).length;
    for (var i = 0; i < len; i++) {
        LoadingMenu.currentProcessText = (i + 1) + "/" + len;
        console.log("Loading Item Category; %s/%s", i+1, len);

        var category = Object.keys(categories)[i];
        var items = categories[category];

        UI.SHOP_ITEMS[category] = [];
        Object.entries(items).forEach((x, i) => {
            var item = new ShopItem(i);

            item.category = category;
            item.title = x[1].title;
            item.description = x[1].description;
            item.image = x[1].image;

            UI.SHOP_ITEMS[category].push(item);
        });
    }

    LoadingMenu.loadingText = "Generating World";

    TileManager.generate();
    Camera.moveTo(0, 0);

    render();
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
        LayerManager.onHover(evt.clientX, evt.clientY);
    }

    static _onclick(evt) {
        LayerManager.onClick(evt.clientX, evt.clientY);
    }

    static _onwheel(evt) {
        if (evt.deltaY < 0) {
            Camera.zoomIn();
        } else if (evt.deltaY > 0) {
            Camera.zoomOut();
        }
    }
    
    static deselectTile() {
        if (Cursor.#selectedTile != undefined) {
            Cursor.#selectedTile.selected = false;
            LayerManager.shouldRenderLayer("world");
        }
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
     * @param {{x: number, y: number}} value
     */
    static set lastKnownPosition(value) {
        Cursor.#lastKnownPosition.x = value?.x || Cursor.#lastKnownPosition.x;
        Cursor.#lastKnownPosition.y = value?.y || Cursor.#lastKnownPosition.y;
    }

    /**
     * @returns {{x: number, y: number}}
     */
    static getPosition() {
        return Cursor.#lastKnownPosition;
    }
}

window.onmousemove = Cursor._onmousemove;
window.onclick = Cursor._onclick;
window.onwheel = Cursor._onwheel;

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
        var time = performance.now();
        Debugging.#frames = Debugging.#frames.filter(x => x > time - 1000);
        Debugging.#frames.push(time);

        ctx.save();
            ctx.font = "16px Arial";
            ctx.fillStyle = "black";
            ctx.fillText("FPS: " + Debugging.#frames.length, 0.01 * clientHeight, 0.045 * clientHeight);
        ctx.restore();
    }
}