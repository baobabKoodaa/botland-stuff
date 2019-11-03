//!import dodging
//!import heatmap
//!import state
//!import utils


// Coordinated attack -> retreat waves with coordinated targeting.
// Loadout: missile3, tele2, repair2

init = function() {

    DODGE_ARTILLERY = 1
    FIRING_DISTANCE = 4

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

    //debugLog("turn", turn, "id", id, "life", life, "x", x, "y", y, "hot?", isLocationHot(x, y))

    if (sharedC == MODE_ATTACK) {
        coordinatedAttackWithDodging()
    } else {
        coordinatedRetreatAndRepair()
    }

    thisShouldNeverExecute()
}

coordinatedRetreatAndRepair = function() {
    sharedC = MODE_RETREAT_REPAIR
    removeSharedTarget()
    if (currLife < 1900) {
        askAlliesToWaitForUsToRepair()
    }
    if (x >= 2) {
        if (x >= 4) {
            tryTeleport(x-5, y)
            tryTeleport(x-4, y-1)
            tryTeleport(x-4, y+1)
            tryTeleport(x-3, y-2)
            tryTeleport(x-3, y+2)
        }
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
        closestAlly = findClosestAlliedBot()
        goRepairIfNeeded(closestAlly)
        lowestLifeFriendly = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
        goRepairIfNeeded(lowestLifeFriendly)
        wait() // If we are blocked from moving to ally in y-direction, just wait. We don't want to ruin our formation by moving in x-direction.
    }
}

goRepairIfNeeded = function(entity) {
    if (exists(entity) && getLife(entity) < 2000) {
        if (willRepair(entity)) repair(entity)
        if (x == getX(entity) && y < getY(entity)) tryMoveTo(x, y+1)
        if (x == getX(entity) && y > getY(entity)) tryMoveTo(x, y-1)
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

scoreTargetCandidate = function(targetCandidate) {
    scoreTCTotal = 0

    // TODO scoring jossa otetaan järkevästi huomioon sekä etäisyys että helat (etäisyydessä _ei vain meihin etäisyys vaan kaikkiin friendlyihin_!)
    // TODO miten sais targetoitua chippejä huomioiden että getEntityAt ei osaa tunnistaa chippiä
    // TODO sometimes lowest health target has escaped behind a wall of enemies. in that case we want to ditch it.
    // TODO scoring huomioi inferred reflectivity

    // Prefer low health enemies
    scoreTCTotal += getLife(targetCandidate)

    // Prefer enemies who are in firing range of as many friendly bots as possible
    ex = getX(targetCandidate)
    ey = getY(targetCandidate)
    scoreTCTotal += scoreTargetDist(ex, ey, f0x, f0y)
    scoreTCTotal += scoreTargetDist(ex, ey, f1x, f1y)
    scoreTCTotal += scoreTargetDist(ex, ey, f2x, f2y)
    scoreTCTotal += scoreTargetDist(ex, ey, f3x, f3y)

    return scoreTCTotal
}

scoreTargetDist = function(ex, ey, fx, fy) {
    if (fx >= 0) { // May be undefined!
        dx = abs(ex - fx)
        dy = abs(ey - fy)
        scoreTCDist = 50*(dx+dy)
        if (dx+dy > FIRING_DISTANCE) scoreTCDist += 150
        return scoreTCDist
    }
    // If this friendly bot doesn't exist, all candidates will be affected the same way regardless if this value is 0 or something else.
    return 0
}

refreshAllyPositions = function() {
    // Variables f0x,f0y,f1x,f1y,f2x,f2y,f3x,f3y will hold positions for nearby allies including self. Refreshed as needed.
    array1 = findEntities(IS_OWNED_BY_ME, BOT, true)
    // Clear out any stale values.
    f0x = -1
    f0y = -1
    f1x = -1
    f1y = -1
    f2x = -1
    f2y = -1
    f3x = -1
    f3y = -1
    // Assign new values
    if (size(array1) > 0) {
        f0x = getX(array1[0])
        f0y = getY(array1[0])
    }
    if (size(array1) > 1) {
        f1x = getX(array1[1])
        f1y = getY(array1[1])
    }
    if (size(array1) > 2) {
        f2x = getX(array1[2])
        f2y = getY(array1[2])
    }
    if (size(array1) > 3) {
        f3x = getX(array1[3])
        f3y = getY(array1[3])
    }
}

chooseTarget = function() {
    bestTarget = null
    bestTargetCandidateScore = 1000000

    // Find nearby allied bots. This is hacky, because we need to find both allied and enemy bots, but we can only use array1!
    refreshAllyPositions()

    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        targetCandidateScore = scoreTargetCandidate(array1[i])
        if (targetCandidateScore < bestTargetCandidateScore) {
            bestTargetCandidateScore = targetCandidateScore
            bestTarget = array1[i]
        }
    }
    return bestTarget
}

assignNewSharedTarget = function() {
    bestTarget = chooseTarget() //was previously: bestTarget = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING)
    if (exists(bestTarget)) {
        ex = getX(bestTarget)
        ey = getY(bestTarget)
        sharedE = 100*ex + ey
    } else {

        array1 = findEntities(ENEMY, BOT, false)
        if (size(array1) > 0) {
            debugLog("turn", turn, "failed to assign a target", x, y)
        }

        removeSharedTarget()
    }
}

weHaveSharedTarget = function() {
    return sharedE >= 0
}

removeSharedTarget = function() {
    sharedE = -1
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
    safetyThreshold = 400 // If we predict we'll have less life than threshold on next turn, then we should teleport away now.
    predictedDmg = max(300, dmgTaken)
    predictedLife = currLife - predictedDmg
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1) predictedLife -= 300 // Remember that we also have a step-out-of-danger move even if we don't coordinate a retreat.
    // TODO consider enemy reflectors in some way?
    // TODO consider our own reflectors in some way?
    // TODO if enemy is about to die, our safetyThreshold should be less! (take a risk to finish off a dying enemy)
    return predictedLife < safetyThreshold
}

coordinatedAttackWithDodging = function() {

    sharedC = MODE_ATTACK

    maybeCoordinateRetreat()
    if (!weHaveSharedTarget()) {
        assignNewSharedTarget()
    }
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1) {
        // Try to step out of melee cardinality, fallback to offensive teleport
        tryMoveToIfSafe(x, y+1)
        tryMoveToIfSafe(x, y-1)
        tryMoveToIfSafe(x-1, y)
        tryMoveToIfSafe(x+1, y)
        tryOffensiveTeleport()
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
            if (willMissilesHit(sharedTargetEntity)) fireMissiles(sharedTargetEntity)
            else {
                // The target may be at distance 5 and our missile range is usually 4
                moveCloserOrSomething(ex, ey)
            }
        }
    }

    // Can we kill chips or cpu?
    chipOrCPU = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING)
    if (exists(chipOrCPU)) {
        maybeDodge()
        if (willMissilesHit(chipOrCPU)) fireMissiles(chipOrCPU)
        tryMoveTo(chipOrCPU)
    }

    // Move towards CPU.
    tryMoveTo(x+1, y)
    if (y > yCPU) tryMoveTo(x, y-1)
    else tryMoveTo(x, y+1)
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
    if (willMissilesHit()) {
        // Hit lowest health enemy in range
        enemies = findEntitiesInRange(ENEMY, BOT, false, 4);
        lowestHealthEnemy = filterEntities(enemies, [SORT_BY_LIFE], [SORT_ASCENDING]);
        if (exists(lowestHealthEnemy) && willMissilesHit(lowestHealthEnemy)) {
            fireMissiles(lowestHealthEnemy)
        }
        fireMissiles()
    }
}

isSafe = function(cx, cy) {
    return !isLocationHot(cx, cy) && countEnemyBotsWithMeleeCardinality(cx, cy) == 0 && countEnemyBotsWithinDist(cx, cy, 1, 4) <= 3
}

tryMoveToIfSafe = function(cx, cy) {
    if (isSafe(cx, cy)) tryMoveTo(cx, cy)
}

tryTeleportIfSafe = function(cx, cy) {
    // Micro-optimizations to prevent unnecessary heavy calculations
    if (outOfBounds(cx, cy)) return
    if (!getDistanceTo(cx, cy) > 5) return
    if (exists(getEntityAt(cx, cy))) return
    // The actual tryTeleportIfSafe functionality
    if (isSafe(cx, cy)) tryTeleport(cx, cy)
}

tryOffensiveTeleport = function() {
    if (!canTeleport()) return
    if (!weHaveSharedTarget()) thisShouldNeverExecute()
    // Try to maintain firing distance, avoid stepping on hot locations, minimize number of enemies in range
    ex = floor(sharedE / 100)
    ey = sharedE % 100
    // Preferred range4 locations
    tryTeleportIfSafe(ex-3, ey-1)
    tryTeleportIfSafe(ex-3, ey+1)
    tryTeleportIfSafe(ex-4, ey)
    // Preferred range3 locations
    tryTeleportIfSafe(ex-2, ey-1)
    tryTeleportIfSafe(ex-2, ey+1)
    tryTeleportIfSafe(ex-3, ey)
    // Fallback range4 locations
    tryTeleportIfSafe(ex-2, ey-2)
    tryTeleportIfSafe(ex-2, ey+2)
    tryTeleportIfSafe(ex-1, ey+3)
    tryTeleportIfSafe(ex-1, ey-3)
    // Fallback range3 locations
    tryTeleportIfSafe(ex-1, ey-2)
    tryTeleportIfSafe(ex-1, ey+2)
}

maybeDodge = function() {
    if (turn >= lastMoveTurn + DODGE_COOLDOWN) {
        // Cooldown so we don't waste all our turns evading. For example, cooldown 3 prevents normal-haste artillery from ever landing a hit on us.
        // This is more crucial to midranger compared to outranger, because midranger will end up in missile vs missile/laser fights, whereas outranger can actually outrange opponents.
        if (x >= xCPU-2 && lastDmgTakenTurn < turn-5) {
            // Reduce unnecessary computation and unnecessary dodging actions when we are killing the CPU.
            return
        }
        if (isLocationHot(x, y)) {
            probablyDodge()
        }
    }
}