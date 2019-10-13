/******************************************************************** Heatmap ********************************************************************/

/** Heatmap format:
 * 	    array2[i] = last turn during which this tile should be counted as heated
 *      array2[i+1] = x coordinate of tile
 *		array2[i+2] = y coordinate of tile
 *		array2[i+3] = heat of tile
 *		Should be iterated from index 1 up to index indicated in array2[0] (exclusive).
 *		If array2[0] > 90 (near array max limit 100), then overflow to index 1 and start overwriting old stuff.
 */

initializeHeatmap = function() {
    array2 = []
    array2[0] = 1 // Next free index in heatmap.
    return array2
}

findTileIndexFromHeatmap = function(cx, cy) {
    for (i=1; i<array2[0]; i+=4) {
        hx = array2[i+1];
        hy = array2[i+2];
        if (hx == cx && hy == cy) {
            return i;
        }
    }
    return -1;
}

updateHeatmapLocation = function(cx, cy, heatAmount) {
    tileIndex = findTileIndexFromHeatmap(cx, cy);
    if (tileIndex > 0) {
        // Tile is already in heatmap
        if (turn > array2[tileIndex]) {
            // Clear out any expired residual heat.
            array2[tileIndex+3] = 0;
        }
        // Add new heat.
        oldHeat = array2[tileIndex+3];
        newHeat = oldHeat + heatAmount;
        array2[tileIndex+3] = newHeat;
        // Update keep-alive
        array2[tileIndex] = turn + HEAT_LONGEVITY;
        return;
    }

    // Add tile to next free slot.
    // If we are near array max limit, overflow back to index 1.
    if (array2[0] > 90) {
        array2[0] = 1;
    }
    j = array2[0];

    // Add tile
    array2[j] = turn + HEAT_LONGEVITY;
    array2[j+1] = cx;
    array2[j+2] = cy;
    array2[j+3] = heatAmount;

    // Update next free slot pointer.
    array2[0] = j+4;
}

getLocationHeat = function(cx, cy) {
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
    damageTaken = prevLife - currLife
    if (damageTaken < DMG_RESPONSE_THRESHOLD) {
        // If we are healed or we take splash damage act as if damage is 0.
        damageTaken = 0
    }
    heatAmount = HEAT_SIT + damageTaken
    updateHeatmapLocation(x, y, heatAmount)
    sharedB = array2
}