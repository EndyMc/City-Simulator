import Images from "./Images.mjs";
import TileManager, { Drawable, Tile } from "./Drawable.mjs";
import { Camera } from "./World.mjs";
import { LayerManager } from "./Layer.mjs";
import UI, { ShopItem } from "./UI.mjs";
import { LoadingMenu } from "./Menu.mjs";
import { Segment } from "./Segment.mjs";

window.init = async () => {
    onresize();
    navigator.storage.persist();

    LoadingMenu.visible = true;
    UI.visible = false;

    LayerManager.layers.world.onRender = (ctx) => {
//        TileManager.getTiles().forEach(x => x.render(ctx));

        Segment.SEGMENTS.forEach(s => {
            var tiles = s.getTiles();
            var selectedTile = Cursor.getSelectedTile();

            if (tiles.includes(selectedTile)) {
                tiles.forEach(x => x.render(ctx));
            } else {
                var image = s.getImage();
                if (image == undefined) return;
    
                var bounds = s.getBounds();
                if (bounds.x2 < 0 || bounds.y2 < 0 || bounds.x1 > clientWidth || bounds.y1 > clientHeight) return;
    
//                ctx.strokeStyle = "red";
//                ctx.strokeRect(bounds.x1, bounds.y1, s.width, s.height);

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(image, bounds.x1, bounds.y1, s.width, s.height);    
            }
        });
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

        if (UI.getBoxes().some(t => t.visible && t.contains(x, y))) {
            Cursor.deselectTile();
//            UI.onHover(x, y);
            return true;
        }

        return false;
    }

    LayerManager.layers.world.onClick = (x, y) => {
        if (UI.shownItem != undefined) {
            var hoveredTile = Cursor.getSelectedTile();
            var tile = new Drawable(hoveredTile.x, hoveredTile.y + 1, hoveredTile.z, UI.shownItem.imagePath, UI.shownItem.type);
            var segments = Segment.SEGMENTS.filter(segment => segment.getTiles().includes(hoveredTile));

            tile.image = UI.shownItem.image;

            TileManager.addTiles(tile);
            console.log(segments);
            segments.forEach(s => s.addTile(tile));

            UI.shownItem = undefined;
        }
    }

    LayerManager.layers.world.onHover = (x, y) => {
        Cursor.lastKnownPosition = { x, y };
        Cursor.updateSelectedTile();

        return true;
    }

    render();

    LoadingMenu.loadingText = "Loading Textures";
    
    var textures = Images.textures;
    var tile = new Drawable();
    for (var i = 0; i < textures.length; i++) {
        var texture = textures[i];
        
        LoadingMenu.currentProcessText = (i + 1) + "/" + textures.length;
        console.log("Loading Textures; %s/%s", i+1, textures.length);

        var image = await new Promise(resolve => {
            if (texture.startsWith("internal:")) {
                resolve(Images.getInternalImage(texture));
            } else {
                var img = new Image();
                img.onload = () => resolve(img);
                img.src = texture;
            }
        });

        Images.addImage(image, texture);
        Images.getImage(texture, tile.width, tile.height);
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
            item.type = x[0];

            UI.SHOP_ITEMS[category].push(item);
        });
    }

    LoadingMenu.loadingText = "Generating World";
    LoadingMenu.currentProcessText = "";

    TileManager.generate();
    Camera.moveTo(0, 0);

}

window.onresize = () => {
    window.clientWidth = innerWidth*2;
    window.clientHeight = innerHeight*2;

    var updatedImages = {};

    TileManager.getTiles().forEach(tile => {
        // Update width and height
        tile.width = 0;
        tile.height = 0;

        if (updatedImages[tile.imagePath] == undefined) {
            updatedImages[tile.imagePath] = true;
            tile.image = Images.getImage(tile.imagePath, tile.width, tile.height);
        } else {
            tile.image = Images.getImageFromCache(tile.imagePath, tile.width, tile.height);
        }
    });

    Segment.SEGMENTS.forEach(s => {
        s.width = 0;
        s.height = 0;
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

    var start = performance.now();
    var delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
    
    handleCameraMovement(delta);
    
    if (Debugging.enabled) LayerManager.shouldRenderLayer("ui");
    var startRender = performance.now();
    LayerManager.render();
    Debugging.renderTimes["total-render"] = performance.now() - startRender;
    
    LayerManager.layersRendered();
    
    Debugging.renderTimes["total"] = performance.now() - start;
}

function handleCameraMovement(delta) {
    var velocity = (clientWidth / screen.width) * 1/2 * delta;
    var xVel = 0;
    var yVel = 0;
    if (window.keys["shift"] != undefined) {
        velocity = (clientWidth / screen.width) * 3/2 * delta;
    }

    if (window.keys["w"] != undefined) {
        yVel -= velocity;
    } if (window.keys["a"] != undefined) {
        xVel -= velocity;
    } if (window.keys["s"] != undefined) {
        yVel += velocity;
    } if (window.keys["d"] != undefined) {
        xVel += velocity;
    }

    var startCameraMovement = performance.now();
    if (xVel != 0 || yVel != 0) {
        Camera.moveBy(xVel, yVel);
    }
    Debugging.renderTimes["camera-movement"] = performance.now() - startCameraMovement;
}

export class Debugging {
    static #frames = [];
    static enabled = true;
    static renderTimes = {};

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    static render(ctx) {
        var time = performance.now();
        Debugging.#frames = Debugging.#frames.filter(x => x > time - 1000);
        Debugging.#frames.push(time);

        ctx.save();
            ctx.font = 0.05 * clientHeight + "px Arial";
            ctx.fillStyle = "white";
            ctx.fillText("FPS: " + Debugging.#frames.length, 0.01 * clientHeight, 0.045 * clientHeight);

            ctx.font = 0.02 * clientHeight + "px Arial";
            var times = Object.entries(Debugging.renderTimes);
            for (var i = 0; i < times.length; i++) {
                if (times[i][1] > 16) {
                    ctx.fillStyle = "yellow";
                } else if (times[i][1] > 33) {
                    ctx.fillStyle = "orange"
                } else if (times[i][1] > 100) {
                    ctx.fillStyle = "red";
                } else {
                    ctx.fillStyle = "white";
                }

                ctx.fillText(times[i][0] + ": " + times[i][1] + "ms", 0.01 * clientHeight, 0.05 * clientHeight + (0.005 * clientHeight + 0.02 * clientHeight) * (i + 1));
            }
        ctx.restore();
    }
}