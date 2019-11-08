//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    // Start specials
    //if (turn == 1 && canReflect()) reflect()

    // Normal actions
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1) {
        if (isZapping()) tryToBreakMeleeCardinalityByMoving()
        tryDefensiveTeleport()
        if (canZap()) zap()
        mineLureRetreat()
    }
    if (isReflecting()) {
        if (currDistToClosestBot >= 5) m(x+1, y)
        if (currDistToClosestBot == 4) idleJobs()
        if (currDistToClosestBot <= 3) {
            if (canLayMine()) layMine()
            m(x-1, y)
        }
        idleJobs()
    }
    if (!isReflecting()) {
        if (!canReflect()) {
            if (currDistToClosestBot <= 5) {
                tryDefensiveTeleport()
                mineLureRetreat()
            }
            idleJobs()
        }
        if (canReflect()) {
            if (currDistToClosestBot <= 6) reflect()

            // Advance by laying mines, without waiting for sensors
            if (canLayMine()) layMine()
            m(x+1, y)

            //Advance with sensors only
            //if (!areSensorsActivated() && canActivateSensors()) activateSensors()
            //if (areSensorsActivated()) m(x+1, y)

            idleJobs()
        }
    }

    thisShouldNeverExecute()
}

mineLureRetreat = function() {
    if (canLayMine()) layMine()
    tryToBreakMeleeCardinalityByMoving()
    m(x-1, y)
}

tryToBreakMeleeCardinalityByMoving = function() {
    moveIfNoMeleeCardinality(x-1, y)
    moveIfNoMeleeCardinality(x, y+1)
    moveIfNoMeleeCardinality(x, y-1)
    moveIfNoMeleeCardinality(x+1, y)
}

tryDefensiveTeleport = function() {
    // Prefer 5 dist jumps backward
    tryTeleport(x-5, y)
    tryTeleport(x-4, y-1)
    tryTeleport(x-4, y+1)
    tryTeleport(x-3, y-2)
    tryTeleport(x-3, y+2)
    tryTeleport(x-2, y-3)
    tryTeleport(x-2, y+3)
    tryTeleport(x-1, y-4)
    tryTeleport(x-1, y+4)
    // Shorter jumps backward
    tryTeleport(x-4, y)
    tryTeleport(x-3, y-1)
    tryTeleport(x-3, y+1)
    tryTeleport(x-2, y-2)
    tryTeleport(x-2, y+2)
    tryTeleport(x-3, y)
    tryTeleport(x-1, y-3)
    tryTeleport(x-1, y+3)
    // Long jumps forward or vertically
    tryTeleport(x+5, y)
    tryTeleport(x+4, y+1)
    tryTeleport(x+4, y-1)
    tryTeleport(x, y+5)
    tryTeleport(x, y-5)
}

idleJobs = function() {
    if (canLayMine()) layMine()
    tryToRepairSomeoneWithoutMoving()
    wait()
}