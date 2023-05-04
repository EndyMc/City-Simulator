class Layer {
    #onRender = (ctx) => {};

    /**
     * @param {String} id The id of the canvas
     * @param {(ctx: CanvasRenderingContext2D) => void} onRender A function which will be called every frame
     */
    constructor(id, onRender) {
        this.canvas = document.getElementById(id);
        /**
         * @type {CanvasRenderingContext2D}
         */
        this.ctx = this.canvas.getContext("2d");

        this.shouldRender = true;
        this.#onRender = onRender || this.#onRender;
    }

    render() {
        if (!this.shouldRender) return;

        this.ctx.clearRect(0, 0, clientWidth, clientHeight);
        this.#onRender(this.ctx);
    }

    /**
     * @param {(ctx: CanvasRenderingContext2D) => void} value
     */
    set onRender(value) {
        this.#onRender = value;
    }
}

export class LayerManager {
    static #layers = {
        background: new Layer("background-layer"),
        world:      new Layer(     "world-layer"),
        entity:     new Layer(    "entity-layer"),
        ui:         new Layer(        "ui-layer"),
    };

    /**
     * @param {String} layer 
     */
    static shouldRenderLayer(layer) {
        LayerManager.#layers[layer].shouldRender = true;
    }

    static layersRendered() {
        Object.values(LayerManager.#layers).forEach(layer => layer.shouldRender = false);
    }

    static render() {
        Object.values(LayerManager.#layers).forEach(layer => layer.render());
    }

    static get layers() {
        return LayerManager.#layers;
    }
}