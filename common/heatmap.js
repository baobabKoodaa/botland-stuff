/** Heatmap format:
 * 	    array2[i] = last turn during which this tile should be counted as heated
 *      array2[i+1] = x coordinate of tile
 *		array2[i+2] = y coordinate of tile
 *		array2[i+3] = heat of tile
 *		Should be iterated from index 1 up to index indicated in array2[0] (exclusive).
 *		If array2[0] > 70 , then overflow to index 1 and start overwriting old stuff.
 */

initializeHeatmap = function() {
    if (!exists(sharedB)) {
        array2 = []
        for (i=0; i<99; i++) {
            // DO NOT REMOVE THIS!
            array2[i] = 0
        }
        array2[0] = 1 // Next free index in heatmap.
        sharedB = array2
    }
}

findTileIndexFromHeatmap = function(cx, cy) {

    // TODO optimize order of lookups by iterating from current pointer backwards (remember reverse overflow)
    for (i=1; i<=70; i+=4) {
        hx = array2[i+1];
        hy = array2[i+2];
        if (hx == cx && hy == cy) {
            return i;
        }
    }
    return -1;
}

updateHeatmapLocation = function(cx, cy, heatAmount) {
    // We need to always write the heat in pointer location.
    // If tile already exists in heatmap, we will remove it from the old location and write to new location.
    // If the old heat is not stale, we will add it to new heat.
    tileIndex = findTileIndexFromHeatmap(cx, cy);
    if (tileIndex > 0) {
        // Tile is already in heatmap
        if (turn <= array2[tileIndex]) {
            // Old heat is not stale, add it to new heat.
            oldHeat = array2[tileIndex+3]
            heatAmount += oldHeat
        }
        // Remove old tile from heatmap
        array2[tileIndex] = null
        array2[tileIndex+1] = null
        array2[tileIndex+2] = null
        array2[tileIndex+3] = null
    }

    // Add tile to next free slot (with overflow to rewrite old slots when we run out of space).
    if (array2[0] > 70) {
        array2[0] = 1;
    }
    j = array2[0];

    // For debugging: warn if we are overwriting fresh heat.
    if (turn <= array2[j]) {
        debugLog("turn", turn, "overwriting fresh heat")
    }

    // Add tile
    array2[j] = turn + HEAT_LONGEVITY;
    array2[j+1] = cx;
    array2[j+2] = cy;
    array2[j+3] = heatAmount;

    // Update next free slot pointer.
    array2[0] = j+4;
}

getLocationHeat = function(cx, cy) {
    array2 = sharedB
    tileIndex = findTileIndexFromHeatmap(cx, cy);
    if (tileIndex < 1) return 0; // tile not found in heatmap
    if (array2[tileIndex] < turn) return 0; // tile found but heat expired some turns ago
    return array2[tileIndex+3]
}

isLocationHot = function(cx, cy) {
    return getLocationHeat(cx, cy) >= HOTNESS_THRESHOLD;
}

updateHeatmap = function() {
    if (!DODGE_ARTILLERY) {
        return
    }
    array2 = sharedB
    heatAmount = HEAT_SIT
    updateHeatmapLocation(x, y, heatAmount)
    sharedB = array2
}