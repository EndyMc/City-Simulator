class World {
    static WATER_LEVEL = 14;
    static WORLD_HEIGHT = 32;

    static generate(width, height) {
        console.log("Generating World");

        var start = performance.now();
        var tiles = [];

        for (var z = -1; z <= height; z += 0.5) {
            for (var x = -1; x <= width; x += 0.5) {
                if ((x % 1 != 0 && z % 1 == 0) || (x % 1 == 0 && z % 1 != 0)) continue;
                var y = Math.round(Math.random()*World.WORLD_HEIGHT);
                tiles.push(new Tile(x, y, z));
            }
        }    

        var depth = 5;
        for (var i = 0; i < depth; i++) {
            console.log("Interpolating world; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            tiles = World.#interpolate(tiles);
        }

        var depth = 5;
        for (var i = 0; i < depth; i++) {
            console.log("Interpolating water; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            var water = tiles.filter(t => t.type == "WATER");
            tiles = tiles.filter(t => t.type != "WATER");
            tiles.push(...World.#interpolateWater(water));
        }

        var depth = 1;
        for (var i = 0; i < depth; i++) {
            console.log("Generating dirt; Depth: %s/%s; %sms", i+1, depth, performance.now() - start);
            tiles.unshift(...World.#generateDirt(tiles));
        }

        console.log("World generated; %sms", performance.now() - start);

        // Make sure that tiles which are higher up on the screen are rendered first
        // Also make sure that tiles with a lower y-position are rendered first
        tiles.sort((a, b) => (a.y) - (b.y));
        tiles.sort((a, b) => (a.z) - (b.z));

        return tiles;
    }

    /**
     * @param {Tile[]} tiles 
     * @returns {Tile[]}
     */
    static #interpolate(tiles) {
        var interpolatedTiles = [];
        tiles.forEach(tile => {
            var neighbours = tiles.filter(t => t.x >= tile.x - 1 && t.x <= tile.x + 1 && t.z >= tile.z - 1 && t.z <= tile.z + 1);
            var averageHeight = neighbours.reduce((t, a) => t + a.y, 0) / neighbours.length;
            interpolatedTiles.push(new Tile(tile.x, Math.round(averageHeight), tile.z));
        });

        return interpolatedTiles;
    }

    /**
     * @param {Tile[]} tiles 
     * @returns {Tile[]}
     */
    static #interpolateWater(tiles) {
        var interpolatedTiles = [];
        tiles.filter(t => t.type == "WATER").forEach(tile => {
            var neighbours = tiles.filter(t => t.x >= tile.x - 1 && t.x <= tile.x + 1 && t.z >= tile.z - 1 && t.z <= tile.z + 1);
            var height = Math.max(...neighbours.map(t => t.y));
            interpolatedTiles.push(new Tile(tile.x, height, tile.z));
        });

        return interpolatedTiles;
    }

    /**
     * @param {Tile[]} tiles
     */
    static #generateDirt(tiles) {
        var dirtTiles = [];
        tiles.forEach(tile => {
            if (tiles.filter(x => x.imagePath == Images.Tiles.DIRT).some(t => t.y == tile.y && t.x == tile.x && t.z == tile.z)) return;

            // The dirt needs to be visible if there's a tile SW or SE which
            // has a y-position which is 2 (or more) lower than the current tile's
            if (tiles.some(t => t.y <= tile.y - 2 && (t.x == tile.x + 0.5 || t.x == tile.x - 0.5 || t.z == tile.z - 0.5 || t.z == tile.z + 0.5))) {
                dirtTiles.push(new Tile(tile.x, tile.y - 1, tile.z, "DIRT"));
            }
        });

        return dirtTiles;
    }
}