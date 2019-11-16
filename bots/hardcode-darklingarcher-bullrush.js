//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    if (turn <= 4) {
        if (canCloak()) cloak()
        m(x+1, y)
        m(x, y-5)
        m(x, y+5)
    }
    if (turn == 5) {
        t(x, y-5)
        t(x, y+5)
        t(x-1, y+4)
        t(x-1, y-4)
    }

    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING)
    if (getDistanceTo(xCPU, yCPU) > 1) {
        m(xCPU+1, yCPU)
        if (canZap()) zap()
        if (willMeleeHit()) melee()
    } else {
        if (canZap()) zap()
        if (canCloak()) cloak()
        if (willMeleeHit(cpu)) melee(cpu)
    }

}