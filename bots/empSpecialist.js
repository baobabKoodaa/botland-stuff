//!import state
//!import utils

// Recommended loadout: Cloak1, Tele2, Emp3, and use the 1 remaining slot for a weapon depending on use case.

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    startSpecialCloakTeleEmp(0,'ZAPPER')
    //darklingSpecial()
    //baitSpecial()

    if (canShield()) {
        lowestLifeFriendly = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
        if (exists(lowestLifeFriendly) && canShield(lowestLifeFriendly)) shield(lowestLifeFriendly)
        shield()
    }
    if (canReflect() && !isCloaked() && dmgTaken > 100 && currDistToClosestBot > 1) reflect()
    if (canCloak() && !isReflecting() && dmgTaken > 100 && !isZapping()) cloak()
    if (canZap()) zap()
    if (willMeleeHit()) melee()
    if (willMissilesHit()) fireMissiles()
    if (isZapping()) {
        // TODO properly; maximize zapper damage while minimizing melee contact
        w()
    }
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

startSpecialCloakTeleEmp = function(movesAfterCloak, empTarget) {
    if (turn == 1) cloak()
    if (turn <= 1+movesAfterCloak) m(x+1, y)
    if (turn <= 2+movesAfterCloak) {
        t(x+5, y)
        t(x+4, y)
        t(x+4, y+1)
        t(x+4, y-1)
        t(x+3, y)
    }
    if (canEmp()) {
        if (turn == 3+movesAfterCloak && y <= yCPU) emp(empTarget)
        if (turn >= 5+movesAfterCloak) emp(empTarget)
    }
}