//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    // Start specials
    if (turn == 1 && canReflect()) reflect()

    // Normal actions
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1) {
        if (isZapping()) tryToBreakMeleeCardinalityByMoving()
        tryDefensiveTeleport()
        if (canZap()) zap()
        if (!isReflecting() && canCloak()) cloak()
        tryToBreakMeleeCardinalityByMoving()
        if (willMeleeHit()) melee()
        mineLureRetreat()
    }
    if (isReflecting()) {
        if (currDistToClosestBot > 5) m(x+1, y)
        // TODO hakeudu cardinalityyn kun reflektataan
        if (currDistToClosestBot == 5) idleJobs()
        if (currDistToClosestBot == 4) idleJobs()
        if (currDistToClosestBot <= 3) {
            if (canLayMine()) layMine()
            m(x-1, y)
        }
        idleJobs()
    }
    if (!isReflecting()) {
        if (!canReflect()) {
            if (currDistToClosestBot == 5) {
                if (distToClosestEnemyBot(x-1, y) > 5) m(x-1, y)
            }
            if (currDistToClosestBot <= 5) {
                tryDefensiveTeleport()
                if (canCloak()) cloak()
                // TODO hakeudu pois cardinalitystä kun ei reflektata
                mineLureRetreat()
            }
            idleJobs()
        }
        if (canReflect()) {
            if (currDistToClosestBot <= 6 && !isCloaked()) reflect()

            // Advance by laying mines, without waiting for sensors
            if (canLayMine()) layMine()
            m(x+1, y)

            //Advance with sensors only
            //if (!areSensorsActivated() && canActivateSensors()) activateSensors()
            //if (areSensorsActivated()) m(x+1, y)

            idleJobs()
        }
    }

    n()
}

mineLureRetreat = function() {
    if (canLayMine()) layMine()
    tryToBreakMeleeCardinalityByMoving()
    m(x-1, y)
    m(x, y+1)
    m(x, y-1)
    m(x+1, y)
}

tryToBreakMeleeCardinalityByMoving = function() {
    moveIfNoMeleeCardinality(x-1, y)
    moveIfNoMeleeCardinality(x, y+1)
    moveIfNoMeleeCardinality(x, y-1)
    moveIfNoMeleeCardinality(x+1, y)
}

tryDefensiveTeleport = function() {
    // Prefer 5 dist jumps backward, then vertically
    t(x-5, y)
    t(x-4, y-1)
    t(x-4, y+1)
    t(x-3, y-2)
    t(x-3, y+2)
    t(x-2, y-3)
    t(x-2, y+3)
    t(x-1, y-4)
    t(x-1, y+4)
    t(x, y+5)
    t(x, y-5)
    // Shorter jumps backward
    t(x-4, y)
    t(x-3, y-1)
    t(x-3, y+1)
    t(x-2, y-2)
    t(x-2, y+2)
    t(x-3, y)
    t(x-1, y-3)
    t(x-1, y+3)
    // Long jumps forward or vertically
    t(x+5, y)
    t(x+4, y+1)
    t(x+4, y-1)
    t(x, y+5)
    t(x, y-5)
}


// TODO teleport-kohteiden pisteytys tän tyyppisesti?
isSafe = function(cx, cy) {
    return countEnemyBotsWithMeleeCardinality(cx, cy) == 0 && countEnemyBotsWithinDist(cx, cy, 1, 3) <= 1
}

tryMoveToIfSafe = function(cx, cy) {
    if (isSafe(cx, cy)) m(cx, cy)
}

tryTeleportIfSafe = function(cx, cy) {
    // Micro-optimizations to prevent unnecessary heavy calculations
    if (outOfBounds(cx, cy)) return
    if (!getDistanceTo(cx, cy) > 5) return
    if (eat(cx, cy)) return
    // The actual tryTeleportIfSafe functionality
    if (isSafe(cx, cy)) t(cx, cy)
}

idleJobs = function() {
    if (canLayMine()) layMine()
    tryToRepairSomeoneWithoutMoving()
    if (willArtilleryHit()) fireArtillery()
    if (willMeleeHit()) melee()
    if (canActivateSensors()) activateSensors()
    w()
}