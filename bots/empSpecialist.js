//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    darklingSpecial()

    //baitSpecial()

    if (canShield()) {
        lowestLifeFriendly = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
        if (exists(lowestLifeFriendly) && canShield(lowestLifeFriendly)) shield(lowestLifeFriendly)
        shield()
    }
    if (canReflect() && dmgTaken > 100 && currDistToClosestBot > 1) reflect()
    if (willMissilesHit()) fireMissiles()
    m(x+1, y)
}

baitSpecial = function() {
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

darklingSpecial = function() {
    if (turn == 1) {
        if (canShield()) shield()
        if (canReflect()) reflect()
    }
    if (turn == 2) {
        tryTeleport(x-5, y)
    }
    if (turn <= 4) {
        m(x-1, y)
    }
    if (turn <= 6) {
        if (willMissilesHit()) fireMissiles()
    }
    if (turn == 7) {
        if (canEmp()) emp('MELEE')
    }
}