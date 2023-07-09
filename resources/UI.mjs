import Images from "./Images.mjs";
import { Cursor } from "./index.mjs";

class Box {
    #x = 0;
    #y = 0;

    #width = 0;
    #height = 0;

    #radii = 0.01;

    #backgroundColor = "#000";
    #opacity = 1;
    #border = {
        size: 0,
        color: "#000"
    }

    #onClick = (x, y) => false;
    #onHover = () => false;

    /**
     * 
     * @param {number} x Number between 0-1
     * @param {number} y Number between 0-1
     * @param {number} width Number between 0-1
     * @param {number} height Number between 0-1
     * @param {number} radii Number between 0-1
     * @param {{ background: string?, opacity: number?, borderWidth: number?, borderColor: string? }} style 
     * @param {(x: number, y: number) => false} onClick 
     */
    constructor(x, y, width, height, radii, style, onClick = (x, y) => false, onHover = () => false) {
        this.#x = x;
        this.#y = y;

        this.#width = width;
        this.#height = height;
        this.#radii = radii;

        this.#onClick = onClick;
        this.#onHover = onHover;

        this.#backgroundColor = style?.background || this.#backgroundColor;
        this.#opacity = style?.opacity || this.#opacity;
        this.#border.size = style?.borderWidth || this.#border.size;
        this.#border.color = style?.borderColor || this.#backgroundColor;

        this.visible = true;
    }

    set width(value) {
        if (value > 1 || value < 0) return;
        this.#width = value;
    }

    set height(value) {
        if (value > 1 || value < 0) return;
        this.#width = value;
    }

    get rawX() { return this.#x; }
    get x() { return this.#x * clientWidth; }

    get rawY() { return this.#y; }
    get y() { return this.#y * clientHeight; }

    get rawWidth() { return this.#width; }
    get width() { return this.#width * clientWidth; }

    get rawHeight() { return this.#height; }
    get height() { return this.#height * clientHeight; }

    get rawRadii() { return this.#radii; }
    get radii() { return this.#radii * clientWidth; }

    set position(value) {
        this.#x = value?.x || this.#x;
        this.#y = value?.y || this.#y;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean} Whether or not this function wants to stop the event from bubbling further down.
     */
    onClick(x, y) {
        if (!this.contains(x, y)) return false;

        this.#onClick(x, y);
        return true;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean} Whether or not this function wants to stop the event from bubbling further down.
     */
    onHover(x, y) {
        if (!this.contains(x, y)) return false;

        this.#onHover();
        return true;
    }

    contains(x, y) {
        return contains(x, y, this.x, this.y, this.width, this.height);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
            ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.width, this.height, this.radii);

                ctx.globalAlpha = this.#opacity;

                ctx.fillStyle = this.#backgroundColor;
                    ctx.fill();

                ctx.lineWidth = this.#border.size;
                ctx.strokeStyle = this.#border.color;
                    ctx.stroke();
        ctx.restore();
    }
}

export class ShopItem {
    #image;
    #title;
    #description;
    #category;
    #cost;
    
    static get aspectRatio() {
        return clientHeight/clientWidth;
    }

    static get CONTAINER_WIDTH() { return ShopItem.aspectRatio * 0.1; }
    static get CONTAINER_HEIGHT() { return 0.1; }

    get width() { return ShopItem.aspectRatio * 0.075; }
    get height() { return 0.075; }

    /**
     * @param {string} path 
     */
    set image(path) {
        this.#image = Images.getImageFromCache(path);
    }

    /**
     * @param {string} value
     */
    set title(value) {
        this.#title = value;
    }

    /**
     * @param {string} value
     */
    set description(value) {
        this.#description = value;
    }

    /**
     * @param {string} value
     */
    set category(value) {
        this.#category = value;
    }
    

    constructor(index) {
        this.position = {
            x: UI.SHOP_BACKGROUND.rawX + (ShopItem.CONTAINER_WIDTH * index) + (ShopItem.CONTAINER_WIDTH - this.width ) / 2,
            y: UI.SHOP_BACKGROUND.rawY + (ShopItem.CONTAINER_HEIGHT - this.height) / 2,
        }        
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        var cursorPosition = Cursor.getPosition();

        var x = this.position.x * clientWidth;
        var y = this.position.y * clientHeight;

        var width = this.width * clientWidth;
        var height = this.height * clientHeight;
        
        if (this.contains(cursorPosition.x, cursorPosition.y)) {
            document.body.style.cursor = "pointer";
            this.hover = true;

            ctx.save();
            ctx.beginPath();
                ctx.roundRect(x, y, width, height, 0.003 * clientWidth);

                ctx.fillStyle = "white";
                ctx.globalAlpha = 0.5;
                ctx.fill();
            ctx.restore();

            ctx.beginPath();
                ctx.roundRect(x - width / 2, y - height / 1.5, width * 2, height / 2, 5);
                
                ctx.fillStyle = "white";
                ctx.fill();

            ctx.beginPath();
                ctx.moveTo(x, y - height / 2);
                ctx.lineTo(x + width / 2, y);
                ctx.lineTo(x + width, y - height / 2);

                ctx.fill();

                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = "1vw Arial";
                ctx.fillText(this.#title, x + width / 2, y - height / 1.5 + height / 4, width * 2);
        } else if (this.hover == true) {
            this.hover = false;
            document.body.style.cursor = "default";
        }
        
        if (this.#image != undefined) {
            ctx.drawImage(this.#image, x, y, width, height);
        }

        ctx.restore();
    }

    contains(screenX, screenY) {
        var x = this.position.x * clientWidth;
        var y = this.position.y * clientHeight;

        var width = this.width * clientWidth;
        var height = this.height * clientHeight;

        return screenX >= x && screenY >= y && screenX <= x + width && screenY <= y + height;
    }

    onClick(x, y) {
        if (!this.contains(x, y)) return false;

        UI.ITEM_INFO.show(this.#title, this.#description, this.#image, this.#cost);

        return true;
    }
}

class ItemInfo {
    position = {
        x: 1 - this.width,
        y: (1 - this.height) / 2,
    }

    #visible = false;

    #image;
    #title = "";
    #description = "";
    #cost;

    #box = new Box(this.position.x, this.position.y, this.width, this.height, 5e-3, { background: "white", opacity: 1 }, () => true, () => true);
    #buttons = {
        exit: { x: this.position.x + 0.01 * ShopItem.aspectRatio, y: this.position.y + 0.01, w: this.#box.rawWidth / 5 * ShopItem.aspectRatio, h: this.#box.rawWidth / 5, onClick: () => { this.#visible = false; this.#box.visible = false; } }
    };

    get box() {
        return this.#box;
    }

    get width() { return 0.15; }
    get height() { return 0.6; }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        if (!this.#visible) {
            if (this.hover) {
                document.body.style.cursor = "default";
                this.hover = false;
            }
            return;
        }

        var cursorPosition = Cursor.getPosition();
        if (Object.values(this.#buttons).some(t => contains(cursorPosition.x, cursorPosition.y, t.x*clientWidth, t.y*clientHeight, t.w*clientWidth, t.h*clientHeight))) {
            document.body.style.cursor = "pointer";
            this.hover = true;
        } else if (this.hover == true) {
            document.body.style.cursor = "default";
            this.hover = false;
        }

        ctx.save();

        this.#box.render(ctx);

        // Draw title
        this.drawTitle(ctx);

        // Draw description in smaller and lighter text
        this.drawDescription(ctx);
        ctx.fillStyle = "#444";
        ctx.font = "1vw monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        var lines = lineWrap(this.#description, ctx, this.#box.width - 0.02 * clientHeight);

        lines.forEach((l, i) => {
            var height = 9e-3 * clientWidth;
            ctx.fillText(l, (this.#buttons.exit.x) * clientWidth, (this.#buttons.exit.y + this.#buttons.exit.h + 0.02) * clientHeight + i * (height + 0.005 * clientHeight));
        });

        // Draw resources needed to build the building

        // Draw an X to be able to exit
        this.drawExit(ctx);

        // Draw a circle to rotate the building clockwise and another one to rotate it anti-clockwise
        // Draw a preview of the building

        ctx.restore();
    }

    drawTitle(ctx) {
        ctx.font = "2vw monospace";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        var underscore = "";
        for (var i = 0; i < this.#title.length; i++) {
            if (/g|y|p|j/.test(this.#title[i])) {
                underscore += " ";
            } else {
                underscore += "_";
            }
        }

        ctx.fillText(this.#title, (this.#buttons.exit.x + this.#buttons.exit.w + 0.01 + (this.#box.rawWidth - (this.#buttons.exit.w + 0.02)) / 2) * clientWidth, (this.#buttons.exit.y + this.#buttons.exit.h / 2) * clientHeight, this.#box.width - (this.#buttons.exit.w + 0.02) * clientWidth);
        ctx.fillText(underscore,  (this.#buttons.exit.x + this.#buttons.exit.w + 0.01 + (this.#box.rawWidth - (this.#buttons.exit.w + 0.02)) / 2) * clientWidth, (this.#buttons.exit.y + this.#buttons.exit.h / 2) * clientHeight, this.#box.width - (this.#buttons.exit.w + 0.02) * clientWidth);
    }

    drawDescription(ctx) {

    }

    drawExit(ctx) {
        var x = this.#buttons.exit.x * clientWidth;
        var y = this.#buttons.exit.y * clientHeight;
        var w = this.#buttons.exit.w * clientWidth;
        var h = this.#buttons.exit.h * clientHeight;

        ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h);

            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w, y);

            ctx.lineWidth = 5;
            ctx.lineCap = "round"
            ctx.strokeStyle = "red";
            ctx.stroke();
    }

    onClick(x, y) {
        x /= clientWidth;
        y /= clientHeight;

        return Object.values(this.#buttons).some(t => {
            if (contains(x, y, t.x, t.y, t.w, t.h)) {
                t.onClick();
                return true;
            }
            return false;
        });
    }

    show(title, description, image, cost) {
        this.#visible = true;
        this.#box.visible = true;

        this.#title = title;
        this.#description = description;
        this.#image = image;
        this.#cost = cost;
    }
}

function contains(x, y, boundsX, boundsY, width, height) {
    return x > boundsX && y > boundsY && x < boundsX + width && y < boundsY + height;
}

/**
 * 
 * @param {string} text 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} maxWidth 
 */
function lineWrap(text, ctx, maxWidth = Infinity) {
    var words = text.split(" ");
    var lines = [];

    var line = "";
    while(words.length > 0) {
        var word = words.shift();
        var measure = ctx.measureText(line + " " + word);
        if (measure.width >= maxWidth) {
            lines.push(line.trim());
            line = word;
        } else {
            line += " " + word;
        }
    }
    
    lines.push(line.trim());

    return lines;
}

export default class UI {
    static SHOP_BACKGROUND = new Box(0.25, 0.88, 0.5, 0.1, 5e-3, { background: "#aaa", opacity: 0.5, borderWidth: 5, borderColor: "white" }, (x, y) => true, () => true);
    /**
     * @type {{ ?: ShopItem[] }}
     */
    static SHOP_ITEMS = {};
    static ITEM_INFO = new ItemInfo();
    static SHOP_TABS = [];

    static CURRENT_CATEGORY = "civilisation";

    static visible = true;

    /**
     * @returns {Box[]}
     */
    static getBoxes() {
        return [ UI.SHOP_BACKGROUND, UI.ITEM_INFO.box ];
    }

    static render(ctx) {
        if (!UI.visible) return;

        UI.SHOP_BACKGROUND.render(ctx);
        UI.ITEM_INFO.render(ctx);
        UI.SHOP_ITEMS[UI.CURRENT_CATEGORY].forEach(x => x.render(ctx));
    }

    static onClick(x, y) {
        return UI.SHOP_ITEMS[UI.CURRENT_CATEGORY].some(t => t.onClick(x, y)) ||
        UI.SHOP_BACKGROUND.onClick(x, y) ||
        UI.ITEM_INFO.onClick(x, y);
    }

    static onHover(x, y) {
        return false;
    }
}

UI.ITEM_INFO.box.visible = false;

window.ui = UI;