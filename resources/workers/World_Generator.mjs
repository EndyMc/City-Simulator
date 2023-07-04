importScripts("../Storage.mjs");

const WORLD_HEIGHT = 64;
const WATER_LEVEL = Math.round(WORLD_HEIGHT / 2) - 1;

var world = undefined;

async function load(startX, startZ, endX, endZ) {
    if (world == undefined) world = await Storage.get().getAll();

    return world.filter(t => t.x >= startX && t.x <= endX && t.z >= startZ && t.z <= endZ);
}

self.onmessage = (event) => {
    var data = event.data;
    self[data.function](...data.params);
}

async function generate(startX, startZ, endX, endZ) {
    var tiles = await load(startX, startZ, endX, endZ);
    var tileHash = [];

    // If there's anything stored, return that.
    if (tiles.length > 0) {
        self.postMessage({ tiles, startX, startZ, endX, endZ });
        return;
    }

    // Otherwise, if nothing was found in storage. Generate a new set of tiles
    for (var z = startZ; z <= endZ; z += 0.5) {
        for (var x = startX; x <= endX; x += 0.5) {
            if ((x + z) % 1 != 0) continue;
            var y = Math.round(Math.random() * WORLD_HEIGHT);
            var tile = { x, y, z, hash: getHash(x, z), type: "GRASS" };
            tiles.push(tile);

            if (tileHash[tile.hash] == undefined) {
                tileHash[tile.hash] = [];
            }
            tileHash[tile.hash].push(tile);
        }
    }

    // Interpolate the height, so that the world is smoother
    var maxDepth = 10;
    for (var depth = 0; depth < maxDepth; depth++) {
        var heights = interpolate(tiles, tileHash);
        for (var i = 0; i < tiles.length; i++) {
            tiles[i].y = heights[i];
        }
    }

    // Any blocks which are below the water-level should become water and 
    // its y-position should that of the water-level.
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (tile.y <= WATER_LEVEL) {
            var neighbours = getNeighbours(tileHash, tile.x, tile.z, 1);
            if ((neighbours.every(t => t.type.includes("WATER") || t.y <= WATER_LEVEL + 0.5))) {
                tile.type = "DEEP_WATER";
                tile.y = WATER_LEVEL + 0.3;
            } else {
                tile.type = "WATER";
                tile.y = WATER_LEVEL + 0.5;
            }
        }
    }

    for (var i = 0; i < tiles.length; i++) {
        if (tiles[i].type != "DEEP_WATER") continue;

        var tile = tiles[i];
        if (getNeighbours(tileHash, tile.x, tile.z, 0.5).every(t => t.type == "WATER")) {
            tile.type = "WATER";
            tile.y = WATER_LEVEL + 0.5;
        }
    }

    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (tile.type == "WATER" || tile.type == "DEEP_WATER") continue;

        var neighbours = getNeighbours(tileHash, tile.x, tile.z, 1);
        var waterNeighbours = neighbours.filter(t => t.type == "WATER");
        if (tile.y == WATER_LEVEL + 1) {
            if (waterNeighbours.length > 0) {
                tile.type = "SAND";
            } else {
                tile.y = WATER_LEVEL + 2;
            }
        }
    }
 
    // Generate dirt to fill in any gaps in the hills
    var maxDepth = WORLD_HEIGHT;
    var dirt = undefined;
    for (var i = 0; i < maxDepth; i++) {
        dirt = generateDirt(tiles, dirt, tileHash);

        tiles.push(...dirt);
        dirt.forEach((tile) => {
            var hash = tile.hash;
            if (tileHash[hash] == undefined) {
                tileHash[hash] = [];
            }
            tileHash[hash].push(tile);
        });
    }
    
    self.postMessage({ tiles, startX, startZ, endX, endZ });
    return;
}

function getHash(x, z) {
    return Math.round(x*10) + "|" + Math.round(z*10);
}

function interpolate(tiles, tileHash) {
    var interpolatedTiles = [];
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        var neighbours = getNeighbours(tileHash, tile.x, tile.z);
        var averageHeight = neighbours.reduce((t, a) => t + a.y, 0) / neighbours.length;

        interpolatedTiles.push(Math.round(averageHeight));
    }

    return interpolatedTiles;
}

function getNeighbours(tileHash, tileX, tileZ, radius = 1) {
    var neighbours = [];
    for (var x = tileX - radius; x <= tileX + radius; x += 0.5) {
        for (var z = tileZ - radius; z <= tileZ + radius; z += 0.5) {
            if ((tileX == x && tileZ == z) || ((x + z) % 1 != 0)) continue;

            neighbours.push(tileHash[getHash(x, z)]?.[0]);
        }
    }

    neighbours = neighbours.filter(t => t != undefined);

    return neighbours;
}

function generateDirt(tiles, dirt, tileHash) {
    var dirtTiles = [];
    (dirt || tiles.filter(x => x.type == "GRASS")).forEach(tile => {
        // Check whether or not there's already a tile under this
        if (tileHash[tile.hash].some(t => t.y == tile.y - 1)) return;

        // The dirt needs to be visible if there's a tile SW or SE which
        // has a y-position which is 2 (or more) lower than the current tile's
        if (
            tileHash[getHash(tile.x + 0.5, tile.z + 0.5)]?.some(t => t.y <= tile.y - 2) || 
            tileHash[getHash(tile.x - 0.5, tile.z + 0.5)]?.some(t => t.y <= tile.y - 2)
        ) {
            dirtTiles.push({ x: tile.x, y: tile.y - 1, z: tile.z, hash: getHash(tile.x, tile.z), type: "DIRT" });
        }
    });

    return dirtTiles;
}