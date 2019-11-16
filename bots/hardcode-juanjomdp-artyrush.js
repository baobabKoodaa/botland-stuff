//!import state
//!import utils

init = function() {
    ROUND = 2

    commonInitProcedures()
}

update = function() {

    commonStateUpdates()

    if (ROUND == 1) {
        if (turn == 1) cloak()
        if (turn == 2) moveTo(x+1, y)
        if (turn == 3) moveTo(x+1, y)
        if (turn == 4) teleport(x+5, y)
        if (turn == 5 || turn == 6) {
            repairer = getEntityAt(xCPU, yCPU-1)
            if (exists(repairer) && willArtilleryHit(repairer)) fireArtillery(repairer)
            repairer = getEntityAt(xCPU, yCPU+1)
            if (exists(repairer) && willArtilleryHit(repairer)) fireArtillery(repairer)
        }
    }
    if (ROUND == 2) {
        if (turn == 1) cloak()
        if (turn == 2) moveTo(x+1, y)
        if (turn == 3) moveTo(x+1, y)
        if (turn == 4) {
            if (y == 0) t(x+4, y+1)
            if (y == arenaHeight-1) t(x+4, y-1)
            t(x+5, y)
        }
        if (turn == 5 || turn == 6) {
            repairer = getEntityAt(xCPU-1, yCPU)
            if (exists(repairer) && willArtilleryHit(repairer)) fireArtillery(repairer)
        }
    }


    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(cpu) && willArtilleryHit(cpu)) {
        fireArtillery(cpu)
    }

    // If we can't fire at CPU let's try to get closer to it.
    if (x < xCPU) m(x+1, y)
    if (y < yCPU) m(x, y+1)
    if (y > yCPU) m(x, y-1)
    if (x < xCPU+1) m(x+1, y)
};