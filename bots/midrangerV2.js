//!import dodging
//!import heatmap
//!import state
//!import utils


// Coordinated attack -> retreat waves with coordinated targeting.
// Loadout: missile3, tele2, repair2

init = function() {

    DODGE_ARTILLERY = 1

    DODGE_COOLDOWN = 3;
    DODGE_PENALTY_DIST_7 = 3
    DODGE_PENALTY_DIST_6 = 3
    DODGE_PENALTY_DIST_5 = 3
    DODGE_PENALTY_DIST_4 = 0
    DODGE_PENALTY_DIST_3 = 0
    DODGE_PENALTY_DIST_2 = 1
    DODGE_PENALTY_DIST_1 = 10
    DODGE_PENALTY_DIST_5_CARDINALITY_EXTRA = 1 // lvl3 lasers are not that common + we have high penalty for 5+ dist anyway
    DODGE_PENALTY_DIST_4_CARDINALITY_EXTRA = 2 // no difference between 4 and 3 dist cardinality; same threat to us in both
    DODGE_PENALTY_DIST_3_CARDINALITY_EXTRA = 2
    DODGE_PENALTY_DIST_2_CARDINALITY_EXTRA = 4 // melee charge cardinality in addition to laser!
    DODGE_PENALTY_EDGE_OF_MAP = 1

    MODE_RETREAT_REPAIR = 0
    MODE_ATTACK = 1
    sharedC = MODE_ATTACK
    sharedD = -1000 // last repair turn
    sharedE = -1 // shared target x,y (100*x + y)

    commonInitProcedures()
    initializeHeatmap()
}

update = function () {
    commonStateUpdates()
    updateHeatmap()

    debugLog("turn", turn, "id", id, "life", life, "x", x, "y", y, "hot?", isLocationHot(x, y))

    if (sharedC == MODE_ATTACK) {
        coordinatedAttackWithDodging()
    } else {
        coordinatedRetreatAndRepair()
    }
}

coordinatedRetreatAndRepair = function() {
    sharedC = MODE_RETREAT_REPAIR
    removeSharedTarget()
    if (currLife < 1900) {
        askAlliesToWaitForUsToRepair()
    }
    if (x >= 2) {
        if (x >= 4) tryDefensiveTeleport()
        tryMoveTo(x-1, y)
        tryMoveTo(x-2, y)
    }
    closestEnemy = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING)
    if (exists(closestEnemy)) {
        coordinatedAttackWithDodging()
    }
    if (!someoneNeedsRepair()) {
        coordinatedAttackWithDodging()
    } else if (currLife < 2000) {
        repair()
    } else {
        // TODO repair allies too
        wait()
    }
}

someoneNeedsRepair = function() {
    return (sharedD >= turn-1)
}

askAlliesToWaitForUsToRepair = function() {
    sharedD = turn
}

longTimeSinceLastRepair = function() {
    return sharedD < turn-10
}



tryMoveToIfSafe = function(cx, cy) {
    if (!isLocationHot(cx, cy) && countEnemyBotsWithMeleeCardinality(cx, cy) == 0) tryMoveTo(cx, cy)
}

assignNewSharedTarget = function() {
    // TODO scoring jossa otetaan järkevästi huomioon sekä etäisyys että helat (etäisyydessä _ei vain meihin etäisyys vaan kaikkiin friendlyihin_!)
    lowestHealthEnemy = findEntity(ENEMY, ANYTHING, SORT_BY_LIFE, SORT_ASCENDING)
    // TODO sometimes lowest health target has escaped behind a wall of enemies. in that case we want to ditch it.
    // TODO scoring huomioi inferred reflectivity
    if (exists(lowestHealthEnemy)) {
        ex = getX(lowestHealthEnemy)
        ey = getY(lowestHealthEnemy)
        sharedE = 100*ex + ey
    } else {
        removeSharedTarget()
    }
}

removeSharedTarget = function() {
    sharedE = -1
}

moveCloserOrSomething = function(ex, ey) {
    // Try to move closer, with preference and safety considerations.
    xDiff = abs(x - ex)
    yDiff = abs(y - ey)
    if (xDiff > yDiff) {
        if (x < ex) tryMoveToIfSafe(x+1, y)
        else tryMoveToIfSafe(x-1, y)
    } else {
        if (y < ey) tryMoveToIfSafe(x, y+1)
        else tryMoveToIfSafe(x, y-1)
    }
    if (x < ex) tryMoveToIfSafe(x+1, y)
    if (x > ex) tryMoveToIfSafe(x-1, y)
    if (y < ey) tryMoveToIfSafe(x, y+1)
    if (y > ey) tryMoveToIfSafe(x, y-1)
    // Fallback if we can't move closer: dodge if needed, otherwise fire on something
    maybeDodge()
    maybeFireMissilesOnSomething()
}

weHaveSharedTarget = function() {
    return sharedE >= 0
}

// TODO shield instead of repair?

maybeCoordinateRetreat = function() {
    if (shouldWeCoordinateRetreat()) {
        coordinatedRetreatAndRepair()
    }
}

shouldWeCoordinateRetreat = function() {
    if (!willRepair()) return false // TODO make this work also in case where we have DEDICATED repairers
    if (!longTimeSinceLastRepair()) return false // Prevent whipsaw
    safetyThreshold = 400 // If we predict we'll have less life than this next turn, then we should teleport away now.
    predictedLife = currLife - dmgTaken // We predict we'll take same amount of damage here next turn
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1) predictedLife -= 300 // Remember that we also have a step-out-of-danger move even if we don't coordinate a retreat.
    // TODO consider enemy reflectors in some way?
    // TODO consider our own reflectors in some way?
    // TODO if enemy is about to die, our safetyThreshold should be less! (take a risk to finish off a dying enemy)
    return predictedLife < safetyThreshold
}

coordinatedAttackWithDodging = function() {

    sharedC = MODE_ATTACK

    debugLog(currLife, sharedE, turn)

    maybeCoordinateRetreat()
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1) {
        // Try to step out of melee cardinality.
        tryMoveToIfSafe(x, y+1)
        tryMoveToIfSafe(x, y-1)
        tryMoveToIfSafe(x-1, y)
        tryMoveToIfSafe(x+1, y)
        // Try to teleport towards home corner (but do not call for a coordinated retreat).
        tryDefensiveTeleport() // TODO optimize teleport location to maintain firing distance to shared target if possible
    }
    if (!weHaveSharedTarget()) {
        assignNewSharedTarget()
    }
    if (weHaveSharedTarget()) {
        // We have shared target
        ex = floor(sharedE / 100)
        ey = sharedE % 100
        // Are we too far to see the target tile?
        if (getDistanceTo(ex, ey) > 5) {
            moveCloserOrSomething(ex, ey)
        }
        // We can see target tile. Enemy might have moved from the target tile or died; always re-assign lowest-health visible enemy as target (when old target tile is visible).
        assignNewSharedTarget()
        // It's possible that we have no enemies in sight.
        if (sharedE > 0) {
            // We have a shared target. Refresh ex,ey variables and get target entity.
            ex = floor(sharedE / 100)
            ey = sharedE % 100
            sharedTargetEntity = getEntityAt(ex, ey)
            maybeDodge()
            // The target may be at distance 5 and our missile range is usually 4
            if (!willMissilesHit(sharedTargetEntity)) {
                moveCloserOrSomething(ex, ey)
            }
            fireMissiles(sharedTargetEntity)
        }
    }

    // Can we kill chips or cpu?
    chipOrCPU = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING)
    if (exists(chipOrCPU)) {
        maybeDodge()
        if (willMissilesHit(chipOrCPU)) fireMissiles(chipOrCPU)
        moveTo(chipOrCPU)
    }

    // Move towards CPU.
    tryMoveTo(x+1, y)
    if (y > yCPU) tryMoveTo(x, y-1)
    else tryMoveTo(x, y+1)
}

maybeFireMissilesOnSomething = function() {
    if (willMissilesHit()) {
        // Hit lowest health enemy in range
        enemies = findEntitiesInRange(ENEMY, BOT, false, 4);
        lowestHealthEnemy = filterEntities(enemies, [SORT_BY_LIFE], [SORT_ASCENDING]);
        if (willMissilesHit(lowestHealthEnemy)) {
            fireMissiles(lowestHealthEnemy)
        }
        // If for some reason unable to fire missiles on lowest health enemy, fire missile on something else
        if (willMissilesHit()) {
            fireMissiles()
        }
    }
}

tryDefensiveTeleport = function() {
    if(!canTeleport()) return
    if (y <= arenaHeight/2) {
        tryTeleport(x-3, y-1)
        tryTeleport(x-4, y)
        tryTeleport(x-2, y-2)
        tryTeleport(x-3, y)
        tryTeleport(x-1, y-3)
        tryTeleport(x, y-4)
    } else {
        tryTeleport(x-3, y+1)
        tryTeleport(x-4, y)
        tryTeleport(x-2, y+2)
        tryTeleport(x-3, y)
        tryTeleport(x-1, y+3)
        tryTeleport(x, y+4)
    }
}

maybeDodge = function() {
    if (isLocationHot(x, y)) {
        // Cooldown for evade so we dont waste all our turns evading. This is more crucial to midranger compared to outranger,
        // because midranger will end up in missile vs missile/laser fights, whereas outranger can actually outrange opponents.
        if (turn >= lastDodgeTurn+DODGE_COOLDOWN) {
            lastDodgeTurn = turn
            probablyDodge()
        }
    }
}