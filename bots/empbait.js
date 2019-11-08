//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    if (turn == 1 && canReflect()) reflect()
    if (currDistToClosestBot == 1 && canTeleport()) {
        tryTeleport(x-3, y-2)
        tryTeleport(x-4, y-1)
        tryTeleport(x-5, y)
    }
    if (turn <= 3) m(x-1, y)
    if (turn >= 8 && canEmp()) emp('MELEE')
    if (canReflect()) reflect()
}