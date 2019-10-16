init = function() {
    DODGE_ARTILLERY = 0
    ALTERNATE_REFLECT_CLOAK = 1
    REFLECT_ALLOWED_FROM_TURN = 1


    commonInitProcedures()
}

update = function() {

    commonStateUpdates()

    d = getDistanceTo(xCPU, yCPU)
    if (turn == 1 && canCloak() && !isCloaked()) {
        cloak()
    }

    if (ALTERNATE_REFLECT_CLOAK) {
        if (!isCloaked() && reflectAllowed()) reflect()
        if (!isReflecting() && canCloak()) cloak()
    }

    // If we can artillery CPU let's do it!
    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    closestBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(cpu) && willArtilleryHit(cpu)) {
        if (currLife >= prevLife-50) {
            fireArtillery(cpu);
        } else if (distanceTo(closestBot) <= 4) {
            if (currLife > 800 && !isCloaked() && canReflect()) {
                reflect()
            }
            if (currLife < 600 && !isReflecting() && canCloak() && !isCloaked()) {
                cloak()
            }
        } else if (DODGE_ARTILLERY) {
            if (x == arenaWidth-1 && canMove('left')) move('left')
            if (x == arenaWidth-2 && canMove('right')) move('right')
        }
        // fallback
        fireArtillery(cpu)
    }

    // We can't fire at CPU, reflect before moving in.
    if (canReflect() && !isCloaked() && distanceTo(closestBot) <= 5) {
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