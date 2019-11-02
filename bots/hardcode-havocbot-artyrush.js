//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {

    commonStateUpdates()

    d = getDistanceTo(xCPU, yCPU)

    if (turn == 10 && canCloak() && !isCloaked()) {
        cloak()
    }
    if (turn <= 13) moveTo(x+1, y)
    if (turn == 14) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }

    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(cpu) && willArtilleryHit(cpu)) {
        fireArtillery(cpu)
    }

    // If we can't fire at CPU let's try to get closer to it.
    if (x < xCPU) tryMoveTo(x+1, y)
    if (y < yCPU) tryMoveTo(x, y+1)
    if (y > yCPU) tryMoveTo(x, y-1)
    if (x < xCPU+1) tryMoveTo(x+1, y)

    // Fallback to things we can do without moving from our hiding spot.
    if (canReflect()) reflect()
    if (willArtilleryHit()) fireArtillery()
    if (willMissilesHit()) fireMissiles()
    if (canActivateSensors()) activateSensors()
};