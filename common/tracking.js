/*
 * NOTE: THIS FILE IS WIP AND PROBABLY DOES NOT WORK AS IS.
 * Using array2 to track multiple different things and share info between bots by using sharedB.
 */

initializeTracking = function() {
    POINTER_NEXT_AVAILABLE_ENEMY_INDEX = 0
    MIN_ENEMY_LOCATION_INDEX = 1
    MAX_ENEMY_LOCATION_INDEX = 19
    POINTER_NEXT_AVAILABLE_SHIELD_INDEX = 20
    MIN_SHIELD_PRIO_INDEX = 21
    MAX_SHIELD_PRIO_INDEX = 29

    if (!exists(sharedB)) {
        array2 = []
        for (i=0; i<99; i++) {
            // DO NOT REMOVE THIS!
            array2[i] = 0
        }
        array2[POINTER_NEXT_AVAILABLE_ENEMY_INDEX] = MIN_ENEMY_LOCATION_INDEX
        array2[POINTER_NEXT_AVAILABLE_SHIELD_INDEX] = MIN_SHIELD_PRIO_INDEX
        sharedB = array2
    }

}

/************************** Enemy location high level functions **********************************/

updateEnemyLocations = function() {
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        enemySpottedAt(ex, ey)
    }
}

decloakHelper = function() {
    array2 = sharedB
    for (i=MIN_ENEMY_LOCATION_INDEX; i<=MAX_ENEMY_LOCATION_INDEX; i+=1) {
        enc = array2[i]
        if (enc != 0) {
            observationTurn = decodeTurn(enc)
            if (observationTurn == turn-1) {
                // We care about observations from last turn
                ex = decodeX(enc)
                ey = decodeY(enc)
                if (getDistanceTo(ex, ey) == 1) {
                    // We care about observations adjacent to us
                    if (!getEntityAt(ex, ey)) {
                        // Enemy was spotted there last turn, but this turn nothing is there.
                        if (countEnemyBotsWithinDist(ex, ey, 1, 1) > 0) {
                            // Maybe the enemy just moved one tile over.
                        } else {
                            // Enemy was there and now nothing is there or at adjacent tiles. Either the enemy died, teleported or cloaked.
                            return enc
                        }
                    }
                }
            }
        }
    }
    return null
}

/************************** Shielding high level functions **********************************/

/*
*      priority is measured as distance to closest enemy bot, lower number means higher priority
*      when a bot is shielded, its priority should be incremented
*/

askForShield = function(priority, ct, cx, cy) {
    enc = encode(0, priority, ct, cx, cy)
    saveEncodedValue(enc, POINTER_NEXT_AVAILABLE_SHIELD_INDEX, MIN_SHIELD_PRIO_INDEX, MAX_SHIELD_PRIO_INDEX)
}

pollPrioritizedShieldWithinRange = function() {
    bestShield = -1
    array2 = sharedB
    for (i=MIN_SHIELD_PRIO_INDEX; i<=MAX_SHIELD_PRIO_INDEX; i+=1) {
        enc = array2[i]
        if (enc != 0) {
            // Shield target may be out of our range.
            distToShieldTarget = abs(x - decodeX(enc)) + abs(y - decodeY(enc))
            if (distToShieldTarget <= 4) {
                // Make sure shield was requested this turn or last turn (because the shielding unit may be acting _before_ the requesting unit).
                if (decodeTurn(enc) >= turn-1) {
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

/************************** Low level functions **********************************/

saveEncodedValue = function(enc, iPointer, iFirstVal, iLastVal) {
    array2 = sharedB

    // Check if value already exists; don't save it twice!
    for (i=iFirstVal; i<=iLastVal; i+=1) {
        if (array2[i] == enc) return
    }

    // Value doesn't already exist; let's save it to next available location.
    iNextFree = array2[iPointer]
    array2[iNextFree] = enc
    array2[iPointer] = array2[iPointer] + 1
    if (array2[iPointer] > iLastVal) array2[iPointer] = iFirstVal // overflow index to rewrite earlier entries next time
    sharedB = array2
}

enemySpottedAt = function(cx, cy) {
    enc = encode(0,0, turn, cx, cy)
    saveEncodedValue(enc, POINTER_NEXT_AVAILABLE_ENEMY_INDEX, MIN_ENEMY_LOCATION_INDEX, MAX_ENEMY_LOCATION_INDEX)
}

/**************************** Encoding/decoding values. **********************************/

/*
 *      0093000400031210
 *      AAAABBBBttttxxyy (valA-valB-turn-x-y)
 *      x,y are coordinates
 *      turn is the turn when this tracking information was saved
 *      valA, valB are additional information which can be saved if needed
 */

// Note: a <= 9006 due to JS integer limit.
encode = function(a, b, ct, cx, cy) {
    if (a > 9006 || b > 9999 || ct > 9999 || cx > 99 || cy > 99) debugLog("encodeError a="+a+",b="+b+",ct="+ct+",cx="+cx+",cy="+cy)
    return a*1000000000000 + b*100000000 + ct*10000 + cx*100 + cy
}

decodePriority = function(enc) {
    return decodeB(enc)
}

decodeA = function(enc) {
    return floor(enc / 1000000000000)
}

decodeB = function(enc) {
    return floor((enc % 1000000000000) / 100000000)
}

decodeTurn = function(enc) {
    return floor((enc % 100000000) / 10000)
}

decodeX = function(enc) {
    return floor((enc % 10000) / 100)
}

decodeY = function(enc) {
    return floor(enc % 100)
}