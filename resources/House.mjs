import { House } from "./Drawable.js";

export default class HouseManager {
    static #houses = [];

    /**
     * @returns {House[]} A copy of the houses array
     */
    static getHouses() {
        return HouseManager.#houses;
    }

    static placeHouse(x, y, z, type) {
        HouseManager.#houses.push(new House(x, y, z, type));
    }
}