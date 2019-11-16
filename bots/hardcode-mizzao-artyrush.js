//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {

    commonStateUpdates()

    if (turn == 1) cloak()
    if (turn == 2) moveTo(x+1, y)
    if (turn == 3) moveTo(x+1, y)
    if (turn == 4) moveTo(x+1, y)
    if (turn == 5) {
        t(x+4, y-1)
        t(x+4, y+1)
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