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
            tryTeleport(x+5, y)
        }
        if (x == 6 && y == 7) {
            goalX = xCPU
            goalY = yCPU+1
            tryTeleport(x+5, y)
        }
        if (x == 9 && y == 1) {
            goalX = xCPU
            goalY = yCPU-1
            tryTeleport(x+4, y+1)
        }
    }
    if (turn == 2 && canCloak()) cloak()

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