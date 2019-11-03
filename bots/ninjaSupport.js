//!import state
//!import utils

init = function() {
    commonInitProcedures()

    REPAIR_X = 0
    REPAIR_Y = 0
}

update = function() {
    commonStateUpdates()

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

    // Shield
    closestFriendlyBot = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_DISTANCE, SORT_DESCENDING);
    if (exists(closestFriendlyBot) && canShield(closestFriendlyBot)) {
        shield(closestFriendlyBot)
    }

    // In the beginning move towards out target position (after possibly shielding some friendly)
    if (x > REPAIR_X) moveTo(x-1, y)
}

tryToRepair = function(cx, cy) {
    entity = getEntityAt(cx, cy)
    if (exists(entity) && willRepair(entity)) {
        repair(entity)
    }
}