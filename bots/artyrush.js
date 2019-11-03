//!import state
//!import utils

init = function() {
    ALTERNATE_REFLECT_CLOAK_ALLOWED_FROM_TURN = 2
    REFLECT_ALLOWED_FROM_TURN = 2

    commonInitProcedures()
}

update = function() {

    commonStateUpdates()

    d = getDistanceTo(xCPU, yCPU)

    if (turn == 1) teleport(x+5, y)

    if (turn >= ALTERNATE_REFLECT_CLOAK_ALLOWED_FROM_TURN) {
        if (reflectAllowed() && !isCloaked() && !isReflecting() && countEnemyBotsWithinDist(x, y, 1, 5) >= 1) reflect()
        if (canCloak() && !isCloaked() && !isReflecting()) cloak()
    }

    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    closestBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(cpu) && willArtilleryHit(cpu)) {
        if (currLife >= prevLife-50) {
            fireArtillery(cpu);
        } else if (distanceTo(closestBot) <= 4) {
            if (currLife > 800 && !isCloaked() && reflectAllowed()) {
                reflect()
            }
            if (currLife < 600 && !isReflecting() && canCloak() && !isCloaked()) {
                cloak()
            }
        }
        // fallback
        fireArtillery(cpu)
    }

    // We can't fire at CPU, reflect before moving in.
    if (reflectAllowed() && !isCloaked() && distanceTo(closestBot) <= 5) {
        reflect();
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