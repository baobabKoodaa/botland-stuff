/*
 * Using array2 to track multiple different things and share info between bots by using sharedB.
 * 1-9: enemy locations
 * 11-19: shield priorities
 * 0: pointer for next available enemy location number (1 to 9, with overflow back to 1)
 * 10: pointer for next available shield priorities (11 to 19, with overflow back to 11)
 *
 * Value encoding:
 *      000400031210
 *      ppppttttxxyy (priority-turn-x-y)
 *      priority is just for shield priorities. in the case of enemy location, priority is 0.
 *      priority is measured as distance to closest enemy bot, lower number means higher priority
 *      when a bot is shielded, its priority should be incremented
 *
 */


initializeTracking = function() {
    POINTER_NEXT_AVAILABLE_ENEMY_INDEX = 0
    MIN_ENEMY_LOCATION_INDEX = 1
    MAX_ENEMY_LOCATION_INDEX = 9
    POINTER_NEXT_AVAILABLE_SHIELD_INDEX = 10
    MIN_SHIELD_PRIO_INDEX = 11
    MAX_SHIELD_PRIO_INDEX = 19

    if (!exists(sharedB)) {
        array2 = []
        array2[0] = MIN_ENEMY_LOCATION_INDEX
        array2[10] = MIN_SHIELD_PRIO_INDEX
        sharedB = array2
    }

}

saveEncodedValue = function(enc, iPointer, iFirstVal, iLastVal) {
    array2 = sharedB

    // Check if value already exists; don't save it twice!
    for (i=iFirstVal; i<=iLastVal; i+=1) {
        if (array2[i] == enc) return
    }

    // Value doesn't already exist; let's save it to next available location.
    iNextFree = array2[iPointer]
    array2[iNextFree] = enc
    array2[iPointer] += 1
    if (array2[iPointer] > iLastVal) array2[iPointer] = iFirstVal // overflow index to rewrite earlier entries next time
    sharedB = array2
}

enemySpottedAt = function(cx, cy) {
    enc = encodeTarget(0, turn, cx, cy)
    saveEncodedValue(enc, POINTER_NEXT_AVAILABLE_ENEMY_INDEX, MIN_ENEMY_LOCATION_INDEX, MAX_ENEMY_LOCATION_INDEX)
}

updateEnemyLocations = function() {
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        enemySpottedAt(ex, ey)
    }
}

askForShield = function(priority, t, cx, cy) {
    enc = encodeTarget(priority, t, cx, cy)
    saveEncodedValue(enc, POINTER_NEXT_AVAILABLE_SHIELD_INDEX, MIN_SHIELD_PRIO_INDEX, MAX_SHIELD_PRIO_INDEX)
}

pollPrioritizedShieldWithinRange = function() {
    bestShield = -1
    array2 = sharedB
    for (i=MIN_SHIELD_PRIO_INDEX; i<=MAX_SHIELD_PRIO_INDEX; i+=1) {
        enc = array2[i]
        // Array2 may have empty/0/null/unknown values.
        if (enc) {
            // Shield target may be out of our range.
            distToShieldTarget = abs(x - decodeX(enc)) + abs(y - decodeY(enc))
            if (distToShieldTarget <= 4) {
                // Make sure shield was requested this turn. (assuming that requesting units act before shielding units. TODO: is this ok?)
                if (decodeTurn(enc) == turn) {
                    // Set this to bestShield if it's the first good shield target we've seen or if it has smaller priority than previous bestShield.
                    if (bestShield < 0 || decodePriority(enc) < decodePriority(bestShield)) {
                        bestShield = enc
                    }
                }
            }
        }
    }
    // Poll bestShield from array2
    for (i=MIN_SHIELD_PRIO_INDEX; i<=MAX_SHIELD_PRIO_INDEX; i+=1) {
        if (array2[i] == bestShield) array2[i] = 0
    }
    sharedB = array2
    return bestShield
}

/**************************** Encoding/decoding values. **********************************/

// TODO päivitä encoding/decoding toimimaan priojen kanssa

encodeTarget = function(priority, t, cx, cy) {
    return t*10000 + cx*100 + cy
}

decodePriority = function(enc) {

}

decodeTurn = function(enc) {
    return floor(enc / 10000)
}

decodeX = function(enc) {
    return floor((enc % 10000) / 100)
}

decodeY = function(enc) {
    return floor(enc % 100)
}