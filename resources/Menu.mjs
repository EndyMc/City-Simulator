import { LayerManager } from "./Layer.mjs";

export class LoadingMenu {
    static visible = false;

    static #loadingText = "";
    static #currentProcessText = "";


    static get loadingText() { return LoadingMenu.#loadingText; }
    static set loadingText(value) {
        LoadingMenu.#loadingText = value;
        LayerManager.shouldRenderLayer("ui");
    }


    static get currentProcessText() { return LoadingMenu.#currentProcessText; }
    static set currentProcessText(value) {
        LoadingMenu.#currentProcessText = value;
        LayerManager.shouldRenderLayer("ui");
    }

    static totalProgress = 0.0;

    static backgroundURL = "images/png-clipart-stars-background-blue-fashion.png";

    /**
     * @type {HTMLImageElement | undefined}
     */
    static background;

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    static render(ctx) {
        if (!LoadingMenu.visible) return;

        ctx.save();

        // Render Background
        if (LoadingMenu.background?.complete) {
            var scale = LoadingMenu.background.width / LoadingMenu.background.height;
            var screenScale = clientWidth / clientHeight;
            
            var w = LoadingMenu.background.width;
            var h = LoadingMenu.background.height;

            if (scale > screenScale) {
                w = clientWidth;
                h = LoadingMenu.background.height / LoadingMenu.background.width * w;
            } else {
                h = clientHeight;
                w = scale * h;
            }

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, clientWidth, h);
            ctx.drawImage(LoadingMenu.background, (clientWidth - w) / 2, 0, w, h);
        } else if (LoadingMenu.background == undefined) {
            LoadingMenu.background = new Image();
            LoadingMenu.background.src = LoadingMenu.backgroundURL;
        }

        // Render Wave
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0.8*clientHeight, clientWidth, 0.2*clientHeight);

        // Render Progress and Objective
        var text = (LoadingMenu.currentProcessText == "" ? "" : LoadingMenu.currentProcessText + " | ") + LoadingMenu.loadingText;

        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        ctx.fillStyle = "black";
        ctx.font = 0.05 * clientHeight + "px Arial"
        ctx.fillText(text, clientWidth / 2, clientHeight - (0.2*clientHeight) / 2, clientWidth * 0.5);

        // Render Bar to show total progress
        var w = LoadingMenu.totalProgress * clientWidth;
        var h = 0.02 * clientHeight;

        ctx.fillStyle = "#a5c";
        ctx.fillRect(0, clientHeight - h, w, h);

        ctx.restore();
    }
}