//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    startSpecialCloakTeleEmp('ZAPPER')
    //darklingSpecial()
    //baitSpecial()

    if (canShield()) {
        lowestLifeFriendly = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
        if (exists(lowestLifeFriendly) && canShield(lowestLifeFriendly)) shield(lowestLifeFriendly)
        shield()
    }
    if (canReflect() && dmgTaken > 100 && currDistToClosestBot > 1) reflect()
    if (canCloak() && dmgTaken > 100) cloak()
    if (willMissilesHit()) fireMissiles()
    m(x+1, y)

    n()
}

baitSpecial = function() {
    if (turn == 1 && canReflect()) reflect()
    if (currDistToClosestBot == 1 && canTeleport()) {
        t(x-3, y-2)
        t(x-4, y-1)
        t(x-5, y)
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
        t(x-5, y)
    }
    if (turn <= 4) {
        m(x-1, y)
    }
    if (turn == 5) {
        if (willMissilesHit()) fireMissiles()
    }
    if (turn == 6) {
        if (canEmp()) emp('MELEE')
    }
}

startSpecialCloakTeleEmp = function(empTarget) {
    if (turn == 1) cloak()
    if (turn == 2) m(x+1, y)
    if (turn == 3) {
        t(x+5, y)
        t(x+4, y)
        t(x+4, y-1)
        t(x+4, y+1)
        t(x+3, y)
    }
    if (canEmp()) {
        if (turn == 4 && y <= yCPU) emp(empTarget)
        if (turn >= 6) emp(empTarget)
    }
}