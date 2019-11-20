//!import state
//!import utils

init = function() {
    commonInitProcedures()

    ALTERNATE_REFLECT_CLOAK = 1
}

update = function() {
    commonStateUpdates()

    if (turn == 1) {
        tryShield(11, 0)
        tryShield(x+2, y)
        if (canShield()) shield()
    }

    if (ALTERNATE_REFLECT_CLOAK) {
        if (!isCloaked() && !isReflecting()) {
            if (canReflect()) reflect()
            if (canCloak()) cloak()
        }
    }

    if (currDistToClosestBot == 1) {
        nmy = findClosestEnemyBot()
        //if (getY(nmy) == 2) m(x, y-1)
        //if (y == 0 && canCloak()) cloak()
    }
    if (canShield()) {
        lowestHealthNearbyFriendlyBot = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
        if (exists(lowestHealthNearbyFriendlyBot) && canShield(lowestHealthNearbyFriendlyBot)) {
            shield(lowestHealthNearbyFriendlyBot)
        }
        shield()
    }
    if (willLasersHit()) fireLasers()
    //if (y == 0) m(x, y+1)

    if (turn > 20) {
        m(x+1, y)
    }
}