init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    if (turn == 1) {
        // Set goal positions
        if (x == 6 && y == 5) {
            goalX = xCPU-1
            goalY = yCPU
        }
        if (x == 6 && y == 7) {
            goalX = xCPU
            goalY = yCPU+1
        }
        if (x == 8 && y == 3) {
            goalX = xCPU
            goalY = yCPU-1
        }
        // First move
        if (canCloak()) cloak()
    }
    if (turn <= 3) {
        if (!getEntityAt(x+1, y)) moveTo(x+1, y)
        tryTeleport(goalX-1, goalY)
        tryTeleport(goalX, goalY-1)
        tryTeleport(goalX, goalY+1)
    }
    if (turn <= 5 && canTeleport(goalX, goalY)) teleport(goalX, goalY)

    // Alternate cloak and reflect
    if (canReflect() && !isReflecting() && !isCloaked()) reflect()
    if (canCloak() && !isReflecting() && !isCloaked()) cloak()

    // Move to CPU
    if (x != goalX || y != goalY) {
        moveTo(goalX, goalY)
    }

    // Melee CPU
    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(cpu) && willMeleeHit(cpu)) {
        melee(cpu);
    }

    // Fallback that should never happen
    figureItOut()
};