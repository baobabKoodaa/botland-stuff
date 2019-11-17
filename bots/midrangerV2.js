//!import dodging
//!import heatmap
//!import state
//!import utils


// Coordinated attack -> retreat waves with coordinated targeting.
// Loadout: missile3, tele2, repair2/shield2

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
    mode = MODE_ATTACK
    sharedC = -1000 // last turn when enemy was discovered near our repair station
    sharedD = -1000 // last turn when some bot needed a repair
    sharedE = -1 // shared target x,y (100*x + y)

    commonInitProcedures()
    initializeHeatmap()

    repairGoalX = max(0, startX-2)
}

update = function () {
    commonStateUpdates()

    updateHeatmap()

    //debugLog("turn", turn, "id", id, "life", life, "x", x, "y", y, "hot?", isLocationHot(x, y))

    if (mode == MODE_ATTACK) {
        coordinatedAttackWithDodging()
    } else {
        retreatAndRepair()
    }

    n()
}

retreatAndRepair = function() {
    mode = MODE_RETREAT_REPAIR
    if (isEnemyNearRepairStation()) {
        coordinatedAttackWithDodging()
    }
    if (currLife < 1900) {
        askAlliesToWaitForUsToRepair()
    }
    if (x > repairGoalX) {
        if (x > repairGoalX+2) {
            t(x-5, y)
            t(x-4, y-1)
            t(x-4, y+1)
            t(x-3, y-2)
            t(x-3, y+2)
        }
        m(x-1, y)
        m(x-2, y)
    }
    closestEnemy = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING)
    if ((exists(closestEnemy) && getX(closestEnemy) <= repairGoalX+5) || (x <= repairGoalX && dmgTaken > 100)) {
        // Repair interrupted if enemy is seen close to repair line _or_ we are taking damage at or behind repair line (from arty at 7 range probably)
        debugLog("turn", turn, "repair interrupted")
        tellAlliesEnemyNearRepairStation()
        removeSharedTarget() // remove stale, old target
        coordinatedAttackWithDodging()
    }
    if (!someoneNeedsRepair()) {
        // Repair finished from all units
        removeSharedTarget() // remove stale target
        coordinatedAttackWithDodging()
    } else if (currLife < 2000) {
        repair()
    } else {
        closestAlly = findClosestAlliedBot()
        goRepairIfNeeded(closestAlly)
        lowestLifeFriendly = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
        goRepairIfNeeded(lowestLifeFriendly)

        w() // If we are blocked from moving to ally in y-direction, just w. We don't want to ruin our formation by moving in x-direction.
    }
}

goRepairIfNeeded = function(entity) {
    if (exists(entity) && getLife(entity) < 2000) {
        if (willRepair(entity)) repair(entity)
        if (x == getX(entity) && y < getY(entity)) m(x, y+1)
        if (x == getX(entity) && y > getY(entity)) m(x, y-1)
    }
}

someoneNeedsRepair = function() {
    return (sharedD >= turn-1)
}

askAlliesToWaitForUsToRepair = function() {
    sharedD = turn
}

isEnemyNearRepairStation = function() {
    return sharedC >= turn-3
}

tellAlliesEnemyNearRepairStation = function() {
    sharedC = turn
}

scoreTargetCandidate = function(targetCandidate) {
    scoreTCTotal = 0

    // TODO scoring jossa otetaan järkevästi huomioon sekä etäisyys että helat (etäisyydessä _ei vain meihin etäisyys vaan kaikkiin friendlyihin_!)
    // TODO miten sais targetoitua chippejä huomioiden että getEntityAt ei osaa tunnistaa chippiä
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
        tcDist = d(ex, ey, fx, fy)
        scoreTCDist = 50 * tcDist
        if (tcDist > FIRING_DISTANCE) scoreTCDist += 150
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
    bestTarget = chooseTarget()
    if (exists(bestTarget)) {
        ex = getX(bestTarget)
        ey = getY(bestTarget)
        sharedE = 100*ex + ey
    } else {
        removeSharedTarget()
    }
}

weHaveSharedTarget = function() {
    return sharedE >= 0
}

removeSharedTarget = function() {
    sharedE = -1
}

determineSafetyThreshold = function() {
    defaultSafetyThreshold = 300
    if (someoneNeedsRepair()) defaultSafetyThreshold = 500
    // Our safety threshold should be lower when our shared target is about to die (take risks to finish off enemies before they can repair).
    // (We don't want to refresh shared target now so we'll look at life of the lowest-health enemy in range instead of life of shared target).
    lowestLifeEnemy = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING)
    if (!exists(lowestLifeEnemy)) {
        // Maybe other units are near a target but we don't have anyone near us.
        return defaultSafetyThreshold
    }
    lifeLLE = getLife(lowestLifeEnemy)
    numberOfMissilesNeeded = ceil(lifeLLE / 300)
    if (numberOfMissilesNeeded == 1) return 100
    if (numberOfMissilesNeeded == 2) return 200
    return defaultSafetyThreshold
}

shouldWeRetreat = function() {
    if (!willRepair()) return false // TODO make this work also in case where we have DEDICATED repairers
    if (isEnemyNearRepairStation()) return false // prevent whipsaw

    // If some of our allies have already retreated and we have only 2 bots or less fighting, retreat regardless of our health!
    friendsNearBattle = size(findEntitiesInRange(IS_OWNED_BY_ME, BOT, true, 5))
    if (someoneNeedsRepair() && friendsNearBattle <= 2) {
        return true
    }

    // Normal case: if we predict we'll have less life than threshold on next turn, then we should teleport away now.
    predictedDmg = max(300, dmgTaken)
    predictedLife = currLife - predictedDmg
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1) predictedLife -= 300 // Remember that we also have a step-out-of-danger move even if we don't coordinate a retreat.
    safetyThreshold = determineSafetyThreshold()
    return predictedLife < safetyThreshold

    // TODO consider enemy reflectors in some way?
    // TODO consider our own reflectors in some way?
}

guessIfWeAreBeingZapped = function() {
    if (currDistToClosestBot <= 2 && dmgTaken > 100) return true
    return false
}

coordinatedAttackWithDodging = function() {

    mode = MODE_ATTACK

    if (shouldWeRetreat()) {
        retreatAndRepair()
    }
    if (!weHaveSharedTarget()) {
        assignNewSharedTarget()
    }
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 1 || guessIfWeAreBeingZapped()) {
        // Try to step out of melee cardinality, fallback to offensive teleport
        tryMoveToIfSafe(x, y+1)
        tryMoveToIfSafe(x, y-1)
        tryMoveToIfSafe(x-1, y)
        tryMoveToIfSafe(x+1, y)
        tryOffensiveTeleport()
    }
    if (canShield()) {
        maybeDodge()
        lowestLifeFriendly = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
        if (exists(lowestLifeFriendly) && canShield(lowestLifeFriendly) && getLife(lowestLifeFriendly) < 1900) shield(lowestLifeFriendly)
        shield()
    }
    if (weHaveSharedTarget()) {
        // We have shared target
        ex = floor(sharedE / 100)
        ey = sharedE % 100
        // Are we too far to shoot at the target tile?
        if (getDistanceTo(ex, ey) > FIRING_DISTANCE) {
            moveCloserOrSomething(ex, ey)
        }
        // We can see target tile. Enemy might have moved from the target tile or died; always re-assign shared target (whenever old target tile is visible AND ALSO adjacent tiles from target are visible (to prevent whipsawing targets)).
        assignNewSharedTarget()
        // It's possible that we have no enemies in sight.
        if (sharedE > 0) {
            // We have a shared target. Refresh ex,ey variables and get target entity.
            ex = floor(sharedE / 100)
            ey = sharedE % 100
            sharedTargetEntity = getEntityAt(ex, ey)
            maybeDodge()
            if (willMissilesHit(sharedTargetEntity)) {
                fireMissiles(sharedTargetEntity)
            } else if (getDistanceTo(ex, ey) > FIRING_DISTANCE) {
                moveCloserOrSomething(ex, ey)
            } else {
                n()
            }
        }
    }

    // Can we kill chips or cpu?
    chipOrCPU = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING)
    if (exists(chipOrCPU)) {
        maybeDodge()
        if (willMissilesHit(chipOrCPU)) fireMissiles(chipOrCPU)
        m(chipOrCPU)
    }

    // Move towards CPU.
    tryMoveToIfSafe(x+1, y)
    if (y > yCPU) tryMoveToIfSafe(x, y-1)
    else tryMoveToIfSafe(x, y+1)

    // Not safe to move
    tryToRepairSomeoneWithoutMoving()
    w()
}

moveCloserOrSomething = function(ex, ey) {

    // Try to move closer to target, with preference and safety considerations.
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

    // We can't move towards target, we can't fire.
    tryToRepairSomeoneWithoutMoving()
    w()
}

isSafe = function(cx, cy) {
    return !isLocationHot(cx, cy) && countEnemyBotsWithMeleeCardinality(cx, cy) == 0 && countEnemyBotsWithinDist(cx, cy, 1, 4) <= 3
}

tryMoveToIfSafe = function(cx, cy) {
    if (isSafe(cx, cy)) m(cx, cy)
}

tryTeleportIfSafe = function(cx, cy) {
    // Micro-optimizations to prevent unnecessary heavy calculations
    if (outOfBounds(cx, cy)) return
    if (!getDistanceTo(cx, cy) > 5) return
    if (exists(getEntityAt(cx, cy))) return
    // The actual tryTeleportIfSafe functionality
    if (isSafe(cx, cy)) t(cx, cy)
}

NFtryTeleportIfSafe = function(cx, cy) {
    // Never forward
    if (cx <= x) {
        tryTeleportIfSafe(cx, cy)
    }
}

tryOffensiveTeleport = function() {
    if (!canTeleport()) return
    if (!weHaveSharedTarget()) n()
    // Try to maintain firing distance, avoid stepping on hot locations, minimize number of enemies in range
    ex = floor(sharedE / 100)
    ey = sharedE % 100
    // Preferred range4 locations
    NFtryTeleportIfSafe(ex-3, ey-1)
    NFtryTeleportIfSafe(ex-3, ey+1)
    NFtryTeleportIfSafe(ex-4, ey)
    // Preferred range3 locations
    NFtryTeleportIfSafe(ex-2, ey-1)
    NFtryTeleportIfSafe(ex-2, ey+1)
    NFtryTeleportIfSafe(ex-3, ey)
    // Fallback range4 locations
    NFtryTeleportIfSafe(ex-2, ey-2)
    NFtryTeleportIfSafe(ex-2, ey+2)
    NFtryTeleportIfSafe(ex-1, ey+3)
    NFtryTeleportIfSafe(ex-1, ey-3)
    // Fallback range3 locations
    NFtryTeleportIfSafe(ex-1, ey-2)
    NFtryTeleportIfSafe(ex-1, ey+2)
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