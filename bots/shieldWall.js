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
        tryTeleport(x-3, y-2)
        tryTeleport(x-4, y-1)
        tryTeleport(x-5, y)
    }
    if (isReflecting()) {
        if (currDistToClosestBot >= 5) m(x+1, y)
        if (currDistToClosestBot == 4) idleJobs()
        if (currDistToClosestBot <= 3) m(x-1, y)
        idleJobs()
    }
    if (!isReflecting()) {
        if (!canReflect()) {
            if (currDistToClosestBot <= 5) {
                tryTeleport(x-5, y)
                tryTeleport(x-4, y+1)
                tryTeleport(x-4, y-1)
                m(x-1, y)
            }
            idleJobs()
        }
        if (canReflect()) {
            if (currDistToClosestBot <= 6) reflect()
            if (!areSensorsActivated() && canActivateSensors()) activateSensors()
            if (areSensorsActivated()) m(x+1, y)
            idleJobs()
        }
    }

    thisShouldNeverExecute()
}

idleJobs = function() {
    tryToRepairSomeoneWithoutMoving()
    wait()
}