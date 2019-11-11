//!import state
//!import utils

init = function() {
    commonInitProcedures()

    REPAIR_X = 1
    REPAIR_Y = 1
}

update = function() {
    commonStateUpdates()

    // Shield
    closestFriendlyBot = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_DISTANCE, SORT_DESCENDING);
    if (exists(closestFriendlyBot) && canShield(closestFriendlyBot)) {
        shield(closestFriendlyBot)
    }

    // Self-defense
    if (countEnemyBotsWithinDist(x, y, 1, 1) >= 1) {
        if (canShield()) shield()
        if (willMeleeHit()) melee()
    }

    // Repair
    tryToRepair(x+1, y)
    tryToRepair(x, y-1)
    tryToRepair(x, y+1)
    tryToRepair(x-1, y)
    tryToRepair(x, y)

    // In the beginning move towards out target position (after possibly shielding some friendly)
    if (x > REPAIR_X) m(x-1, y)
    if (y > REPAIR_Y) m(x, y-1)
    if (y < REPAIR_Y) m(x, y+1)
}

tryToRepair = function(cx, cy) {
    entity = getEntityAt(cx, cy)
    if (exists(entity) && willRepair(entity)) {
        repair(entity)
    }
}