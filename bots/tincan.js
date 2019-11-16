//!import state
//!import utils

init = function() {

    TELEPORT_ALLOWED_FROM_TURN = 1
    REFLECT_ALLOWED_FROM_TURN = 1
    ZAP_ALLOWED_FROM_TURN = 1
    OFFENSIVE_TELEPORT_ALLOWED = 1
    ALTERNATE_REFLECT_CLOAK = 1
    SENSORS_ALLOWED_FROM_TURN = 999

    // forwmine related
    LURE_UP = false
    MODE_MINES_FORWARD = 1
    MODE_LURE_THEM_IN = 2
    MODE_NORMAL = 3

    // backwmine related
    BACKW_MINES_STALL = false

    // hitnrun related
    MODE_FIND_TARGET = 1
    MODE_GANK = 2
    MODE_RETREAT_REPAIR = 3
    REPAIR_AVAILABLE = 1
    REPAIR_X = 1
    REPAIR_Y = 1

    commonInitProcedures();

    // sharedA reserved for [HITANDRUN] when an enemy was last seen near repair station
    // sharedB reserved for general purpose shared array
    // sharedC reserved for
    //          [FORWMINES] coordinated teleport (turn when teleport was triggered; that turn + the next turn bots will try to teleport back)
    //          [HITANDRUN] coordinated gank (turn when gank was triggered; bots will try to gank ONLY ON THE TURN AFTER THAT)
    // sharedD reserved for
    //          [FORWMINES] end-of-wait-lure
    //          [HITANDRUN] turn when an ally last needed repair
    // sharedE reserved for [HITANDRUN] shared target (x*100+y)
};

update = function() {

    commonStateUpdates()

    //startSpecialRonBait()
    //startSpecialDarklingArcher3()
    //startSpecialJuanjoBait()
    //startSpecialForwMines()
    //startSpecialBackwmines()
    startSpecialAttackForwardEvenIfNoVisibility(0)
    //startSpecialAttackVerticallyCenterEvenIfNoVisibility()

    //startSpecialRon3()
    //if (turn < 150) hitAndRun()

    normalActions()
}

normalActions = function() {
    target = chooseTarget()
    if (exists(target)) fight(target)
    else goAfterCPUandChips()
}

/*************************************************** HIT AND RUN **********************************************************/

/*

hitAndRun = function() {
    if (!mode) mode = MODE_FIND_TARGET
    if (mode == MODE_FIND_TARGET) hitAndRunFindTarget()
    if (mode == MODE_GANK) hitAndRunGank()
    if (mode == MODE_RETREAT_REPAIR) hitAndRunRetreat()
    n("a")
}

hitAndRunFindTarget = function() {
    mode = MODE_FIND_TARGET
    if (isGankTriggered()) {
        // Someone triggered gank last turn.
        hitAndRunGank()
    }
    if (!weHaveSharedTarget()) {
        assignNewSharedTarget()
    }
    if (!weHaveSharedTarget()) {
        // We have no shared target and we are unable to see any enemy bots.
        moveAsAGroup()
    }
    // We have shared target.
    ex = getSharedTargetX()
    ey = getSharedTargetY()
    if (getDistanceTo(ex, ey) > 5) {
        // We can't see the target tile, move closer to it.
        moveCloser(ex, ey)
        n("c")
    }
    // We can see the target tile, but target may have moved or new enemies may have appeared; refresh shared target.
    assignNewSharedTarget()
    if (!weHaveSharedTarget()) {
        // Target has disappeared and no targets in sight.
        clearSharedTarget()
        moveAsAGroup()
    }
    // Target may have been refreshed so we need to refresh these variables.
    ex = getSharedTargetX()
    ey = getSharedTargetY()
    if (getDistanceTo(ex, ey) <= 2) {
        // This shouldn't usually happen but the enemy might teleport to us, etc.
        triggerGank()
        hitAndRunGank()
    }
    if (allNearbyFriendliesCanTeleportToTarget(ex, ey)) {
        triggerGank()
    }
    if (canReflect() && dmgTaken > 100) reflect()
    // All tincans should try to maintain 4 dist to target.
    dx = abs(x - ex) // These were overwritten by allNearbyFr... so we need to set them again
    dy = abs(y - ey) // These were overwritten by allNearbyFr... so we need to set them again
    if (dx+dy > 4) {
        moveCloser(ex, ey)
    } else if (dx+dy < 4) {
        moveFurther(ex, ey)
    } else if (dx+dy == 4) {
        // Prevent deadlocks
        move()
    }
    n("e")
}

moveAsAGroup = function() {
    // If we are far from nearest friendly, get closer.
    closestAlly = findClosestAlliedBot()
    if (exists(closestAlly)) {
        fnx = getX(closestAlly)
        fny = getY(closestAlly)
        if (getDistanceTo(fnx, fny) >= 3) {
            // Distance 3 from nearest friendly considered to be far.
            if (fny != REPAIR_Y || fnx != REPAIR_X) {
                // If nearest ally is not the repairman, move closer.
                m(fnx, fny)
            }
        }
    }

    // Can we kill chips or cpu?
    chipOrCPU = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING)
    if (exists(chipOrCPU)) {
        if (willMeleeHit(chipOrCPU)) melee(chipOrCPU)
        m(chipOrCPU)
    }

    // Move towards the CPU
    if (x < xCPU-3) m(x+1, y)
    if (y < yCPU) m(x, y+1)
    if (y > yCPU) m(x, y-1)

    n("b")
}

hitAndRunGank = function() {
    mode = MODE_GANK
    if (!weHaveSharedTarget()) {
        // Someone has cleared shared target, we probably killed the enemy.
        askAlliesToWaitForUsToRepair() // This is hacky.
        hitAndRunRetreat()
    }
    if (shouldWeRetreat()) {
        // Escape early if we predict we're about to die
        askAlliesToWaitForUsToRepair() // This is hacky.
        hitAndRunRetreat()
    }

    ex = getSharedTargetX()
    ey = getSharedTargetY()
    if (getDistanceTo(ex, ey) > 5) {
        moveCloser(ex, ey)
        n()
    }
    if (countEnemyBotsWithinDist(ex, ey, 0, 2) == 0) {
        if (getDistanceTo(ex, ey) == 5) {
            // Enemy probably just moved out of sight.
            moveCloser(ex, ey)
            n()
        } else {
            // We probably killed the enemy target since no enemy is near our previously set target. Run unless we are fighting some other enemy.
            if (currDistToClosestBot >= 2) { // TODO need to consider minDistOfAnyFriendlyToAnyEnemy
                clearSharedTarget()
                askAlliesToWaitForUsToRepair() // This is a hack to prevent whipsaw where some bots need heal and others dont and the needing-heal-bots dont have a chance to say they need a heal before another bot thinks no-one needs heal.
                hitAndRunRetreat()
            } else {
                // We are engaged with some other enemy, make it the new target.
                assignNewSharedTarget()
            }
        }

    }
    // Refresh shared target because target may have moved (or we may have killed it but another target may be in the vicinity of the old target).
    assignNewSharedTarget()
    if (!weHaveSharedTarget()) {
        // We have killed the target or it has cloaked, teleported, or moved out of range AND we see no other targets anywhere.
        clearSharedTarget()
        askAlliesToWaitForUsToRepair() // This is hacky.
        hitAndRunRetreat()
    }
    // Need to refresh these variables
    target = getSharedTargetEntity()
    ex = getSharedTargetX()
    ey = getSharedTargetY()
    dx = abs(x - ex)
    dy = abs(y - ey)
    if (canReflect() && currDistToClosestBot >= 3) reflect()
    if (canZap()) zap()
    if (!willMeleeHit(target) && turn == coordinatedGankTeleportTurn()) {
        // TODO if the target has moved backward, some of our tincans will be able to teleport to only some of the locations; we need to coordinate who teleports where so that we guarantee that all tincans will be able to teleport next to target.
        tryTeleport(ex - 1, ey)
        tryTeleport(ex, ey-1)
        tryTeleport(ex, ey+1)
        tryTeleport(ex+1, ey)
        // Fallback if preferred tiles are occupied
        tryTeleport(ex-1, ey-1)
        tryTeleport(ex-1, ey+1)
        tryTeleport(ex+1, ey-1)
        tryTeleport(ex+1, ey+1)
    }
    if (willMeleeHit(target)) melee(target)
    m(ex, ey)
    n("f")
}

hitAndRunRetreat = function() {
    mode = MODE_RETREAT_REPAIR
    distToRepair = getDistanceTo(REPAIR_X, REPAIR_Y)
    closestEnemy = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING)
    if ((exists(closestEnemy) && getX(closestEnemy) <= REPAIR_X+5) || (x <= REPAIR_X+1 && dmgTaken > 100)) {
        // Repair interrupted if enemy is seen close to repair line _or_ we are taking damage at or behind repair line (from arty at 7 range probably)
        tellAlliesEnemyNearRepairStation()
    }
    if (isEnemyNearRepairStation()) {
        fightEnemyNearRepairStation()
    }
    if (!REPAIR_AVAILABLE) {
        hitAndRunFindTarget()
    }
    if (currLife < 1900) {
        askAlliesToWaitForUsToRepair()
        if (distToRepair > 1) {
            if (canCloak() && !isCloaked()) {
                cloak()
            }
            if (canTeleport() && distToRepair > 5) {
                // TODO teleport-towards-repair targets properly
                tryTeleport(x-4, y-1)
                tryTeleport(x-3, y-2)
            }
            // Try to move towards the 'corner' of repair-man
            if (x > REPAIR_X+1) m(x-1, y)
            if (x < REPAIR_X-1) m(x+1, y)
            if (y > REPAIR_Y+1) m(x, y-1)
            if (y < REPAIR_Y-1) m(x, y+1)
            // Try to move next to the repair-man
            if (x > REPAIR_X) m(x-1, y)
            if (x < REPAIR_X) m(x+1, y)
            if (y > REPAIR_Y) m(x, y-1)
            if (y < REPAIR_Y) m(x, y+1)
            // Fallback to random move in order to break deadlocks
            move()
        } else {
            if (!getEntityAt(REPAIR_X, REPAIR_Y)) {
                // Repair-man is dead
                REPAIR_AVAILABLE = 0
            }
            wait()
        }
    } else if (someoneNeedsRepair()) {
        if (distToRepair > 5) {
            // Move towards repair-man
            if (canCloak() && !isCloaked()) cloak()
            if (x > REPAIR_X) m(x-1, y)
            if (y > REPAIR_Y) m(x, y-1)
            if (y < REPAIR_Y) m(x, y+1)
            if (x < REPAIR_X) m(x+1, y)
        } else if (x != REPAIR_X + 1 || y > REPAIR_Y + 4) {

            myBotsInRange = findEntities(IS_OWNED_BY_ME, BOT, false)
            lowestHealthAlly = filterEntities(myBotsInRange, [SORT_BY_LIFE], [SORT_ASCENDING])
            if (exists(lowestHealthAlly) && getLife(lowestHealthAlly) >= 1900) {
                // We are the last bot that needs healing, we have a special destination to get into nice formation.
                m(REPAIR_X + 1, REPAIR_Y + 1)
            }

            // Move out of way so teammates can repair. Move into something loosely resembling a formation.
            m(REPAIR_X + 1, REPAIR_Y + 3)
            m(REPAIR_X + 1, REPAIR_Y + 2)
            m(REPAIR_X + 1, REPAIR_Y + 4)
            // Fallback
            m(REPAIR_X+1, REPAIR_Y)
            m(REPAIR_X, REPAIR_Y+1)
            m(REPAIR_X, REPAIR_Y)
        } else {
            wait()
        }
    } else {
        // We don't need more repair, our teammates don't need more repair. Assume our cooldowns are ok too.
        hitAndRunFindTarget()
    }
    n("r")
}

determineSafetyThreshold = function() {
    safetyThreshold = 300
    if (someoneNeedsRepair()) safetyThreshold += 200
    if (isZapping()) safetyThreshold -= 200
    if (isReflecting()) safetyThreshold -= 100
    // Our safety threshold should be lower when our shared target is about to die (take risks to finish off enemies before they can repair).
    // (We don't want to refresh shared target now so we'll look at life of the lowest-health enemy in range instead of life of shared target).
    lowestLifeEnemy = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING)
    if (exists(lowestLifeEnemy)) {
        // Maybe other units are near a target but we don't have anyone near us.
        lifeLLE = getLife(lowestLifeEnemy)
        if (lifeLLE <= 450) safetyThreshold -= 100
    }

    return max(0, safetyThreshold)
}

shouldWeRetreat = function() {
    if (isEnemyNearRepairStation()) return false // prevent whipsaw

    // If no allies are fighting next to us, and at least one ally has gone for repairs, we should prolly too
    friendsNearBattle = size(findEntitiesInRange(IS_OWNED_BY_ME, BOT, true, 2))
    if (someoneNeedsRepair() && friendsNearBattle <= 1) {
        return true
    }

    // Normal case: if we predict we'll have less life than threshold on next turn, then we should teleport away now.
    predictedDmg = max(500, dmgTaken)
    if (countEnemyBotsWithMeleeCardinality(x, y) >= 2) predictedDmg += 300
    predictedLife = currLife - predictedDmg
    safetyThreshold = determineSafetyThreshold()
    return predictedLife < safetyThreshold
}

moveCloser = function(cx, cy) {
    if (getDistanceTo(cx, cy) > 5) {
        // Has potential for deadlock
        if (x < cx) m(x+1, y)
        if (y < cy) m(x, y+1)
        if (y > cy) m(x, y-1)
        if (x > cx) m(x-1, y)
    } else {
        // Smarter pathfinding
        m(cx, cy)
    }
    n("g")
}

moveFurther = function(cx, cy) {
    if (x >= cx) m(x+1, y)
    if (y >= cy) m(x, y+1)
    if (y <= cy) m(x, y-1)
    if (x <= cx) m(x-1, y)
    // Fallback
    if (canReflect()) reflect()
    if (canZap()) zap()
    if (willMeleeHit()) melee()
    wait()
}

isGankTriggered = function() {
    return sharedC == turn-1
}

triggerGank = function() {
    sharedC = turn
}

coordinatedGankTeleportTurn = function() {
    return sharedC + 3 // wait-for-all-to-have-equal-opportunity, ref, zap, tele == +3
}

scoreTargetCandidate = function(targetCandidate) {
    scoreTCTotal = 0

    // Mainly choose the enemy which is closest to our bots
    ex = getX(targetCandidate)
    ey = getY(targetCandidate)
    scoreTCTotal += scoreTargetDist(ex, ey, f0x, f0y)
    scoreTCTotal += scoreTargetDist(ex, ey, f1x, f1y)
    scoreTCTotal += scoreTargetDist(ex, ey, f2x, f2y)
    scoreTCTotal += scoreTargetDist(ex, ey, f3x, f3y)

    // Break ties by choosing the lowest health enemy
    scoreTCTotal += getLife(targetCandidate)

    return scoreTCTotal
}

scoreTargetDist = function(ex, ey, fnx, fny) {
    if (fnx >= 0) { // May be undefined!
        dx = abs(ex - fnx)
        dy = abs(ey - fny)
        scoreTCDist = 1000*(dx+dy)
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
    bestTargetCandidateScore = 1000000000

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
        setSharedTarget(ex, ey)
    } else {
        clearSharedTarget()
    }
}

clearSharedTarget = function() {
    sharedE = null
}

weHaveSharedTarget = function() {
    return exists(sharedE)
}

setSharedTarget = function(ex, ey) {
    sharedE = 100*ex + ey
}

getSharedTargetX = function() {
    return floor(sharedE / 100)
}

getSharedTargetY = function() {
    return sharedE % 100
}

getSharedTargetEntity = function() {
    if (!exists(sharedE)) return null
    return getEntityAt(getSharedTargetX(), getSharedTargetY())
}

allNearbyFriendliesCanTeleportToTarget = function(ex, ey) {
    array1 = findEntities(IS_OWNED_BY_ME, BOT, true)
    for (i = 0; i < size(array1); i++) {
        fx = getX(array1[i])
        fy = getY(array1[i])
        if (fy >= y-2) {
            // Friendlies further behind than this are probably repair/support units.
            dx = abs(ex - fx)
            dy = abs(ey - fy)
            if (dx+dy > 4) {
                // This could be 6, but we don't want to deal with edge cases so we set this at 5. Even this may cause us problematic edge cases sometimes.
                return false
            }
        }
    }
    return true
}

someoneNeedsRepair = function() {
    return (sharedD >= turn-1)
}

askAlliesToWaitForUsToRepair = function() {
    sharedD = turn
}

isEnemyNearRepairStation = function() {
    return sharedA >= turn-3
}

tellAlliesEnemyNearRepairStation = function() {
    sharedA = turn
}

fightEnemyNearRepairStation = function() {
    // Quick hack. TODO: properly.
    normalActions()
}


 */

/*************************************************** Various start specials **********************************************************/

startSpecialRon2 = function() {
    if (mode) return
    if (turn <= 2) {
        if (canReflect()) reflect()
        if (canZap()) zap()
    }
    if (turn <= 10) {
        meleeAnythingButDontCharge()
        mode = MODE_RETREAT_REPAIR
        tryTeleport(x-5, y)
        tryTeleport(x-4, y-1)
        tryTeleport(x-3, y-2)
        tryTeleport(x-4, y)
    }
}

startSpecialRon3 = function() {
    if (turn <= 2) wait()
    if (turn == 3) {
        if (currDistToClosestBot <= 5 && canReflect()) reflect()
        m(x+1, y)
    }
    if (turn <= 6) {
        if (x == startX) m(x+1, y)
        if (canReflect()) reflect()
        if (canZap()) zap()
        tryTeleport(x+5, y)
        probablyTeleportToBestOffensiveTeleportLocation()
    }
}


startSpecialAttackForwardEvenIfNoVisibility = function(movesToRight) {
    if (!movesToRight) movesToRight = 0
    if (turn <= movesToRight) m(x+1, y)
    if (turn <= 4 + movesToRight) {
        if (canReflect()) reflect()
        if (canZap()) zap()
        tryTeleport(x+5, y)
        probablyTeleportToBestOffensiveTeleportLocation()
    }
}

startSpecialAttackVerticallyCenterEvenIfNoVisibility = function() {
    if (turn <= 3) {
        if (canReflect()) reflect()
        if (canZap()) zap()
        tryTeleport(x, y+5)
        tryTeleport(x, y-5)
        tryTeleport(x+1, y-4)
        tryTeleport(x-1, y-4)
        tryTeleport(x+1, y+4)
        tryTeleport(x-1, y+4)
        probablyTeleportToBestOffensiveTeleportLocation()
    }
}


startSpecialBackwmines = function() {
    if (mode == MODE_NORMAL) {
        return
    }
    if (haveAlliesSignalledNormalMode()) {
        mode = MODE_NORMAL
        m(x-1, y)
        return
    }
    if (canReflect() && turn >= REFLECT_ALLOWED_FROM_TURN && currDistToClosestBot <= 5) reflect()
    if (turn < 10) {
        if (currDistToClosestBot <= 1) {
            signalAlliesNormalMode()
            m(x-1, y)
            mode = MODE_NORMAL
            return
        }
        if (canLayMine() && currDistToClosestBot >= 3) layMine()
        if (BACKW_MINES_STALL && currDistToClosestBot >= 5) wait() // maintain visibility to lure the enemy in
        m(x-1, y)
        wait()
    }
}

hasWaitLureEnded = function() {
    if (haveAlliesSignalledNormalMode()) return true
    if (currDistToClosestBot <= 2 && canZap()) return true
}

haveAlliesSignalledNormalMode = function() {
    return sharedD
}

signalAlliesNormalMode = function() {
    sharedD = true
}

eat = function(cx, cy) {
    return (exists(getEntityAt(cx, cy)))
}

startSpecialJuanjoBait = function() {
    if (turn == 1) wait()
    if (turn <= 3) m(x-1, y)
    if (turn <= 8) {
        if (canReflect() && currDistToClosestBot <= 5) reflect()
        if (canZap() && currDistToClosestBot <= 2) zap()
        tryMelee(x+1, y)
        tryMelee(x, y+1)
        tryMelee(x, y-1)
        tryMelee(x-1, y)
    }
    if (turn <= 7) wait()
}

startSpecialDarklingArcher = function() {
    if (turn == 1) layMine()
    if (turn == 2) {
        if (x >= 6) {
            tryTeleport(2, 5)
            tryTeleport(2, 6)
            tryTeleport(2, 7)
        }
        m(x-1, y)
    }
    if (turn <= 7) {
        if (canReflect()) {
            // Reflect if needed
            if (getEntityAt(x+3, y) || getEntityAt(x+4, y) || getEntityAt(x+5, y)) {
                reflect()
            }
        }
        if (x > 0) {
            // Minelure
            if (canLayMine()) {
                layMine()
            } else {
                m(x-1, y)
            }
        }
    }
}

startSpecialDarklingArcher2 = function() {
    if (currDistToClosestBot <= 2) return
    if (turn == 1) {
        if (y == 4) tryTeleport(x-4, y+1)
        if (y == 6) tryTeleport(x-5, y)
        if (y == 8) tryTeleport(x-4, y-1)
    }
    if (turn <= 3) {
        if (getEntityAt(x+3, y) || getEntityAt(x+4, y) || getEntityAt(x+5, y)) {
            reflect()
        }
        wait()
    }
    if (turn <= 7) {
        if (canReflect()) reflect()
        if (canZap()) zap()
        m(x+1, y)
    }
}

startSpecialDarklingArcher3 = function() {
    if (turn == 1) wait()
    if (turn == 2) layMine()
    if (turn <= 4) m(x-1, y)
    if (turn <= 6) {
        if (canReflect()) reflect()
        if (canZap()) zap()
    }
}

startSpecialDarklingArcher4 = function() {
    if (turn <= 2) {
        if (canZap()) zap()
        if (canReflect()) reflect()
    }
}

startSpecialRonBait = function() {
    if (turn <= 4) wait()
    if (turn == 5) zap()
    if (turn <= 7) {
        if (willMeleeHit()) melee()
        m(x+1, y)
    }
}

refcanSpecial = function() {
    if (!isReflecting() && !canTeleport() && !canReflect()) {
        target = chooseTarget();
        if (exists(target)) fight(target)
        wait()
    }
    if (canReflect()) {
        reflect()
    }
    if (isReflecting()) {
        target = chooseTarget();
        if (exists(target)) fight(target)
        else goAfterCPUandChips()
    }
    if (!isReflecting() && canTeleport()) {
        tryTeleport(x-5, y)
        tryTeleport(x-4, y-1)
        tryTeleport(x-4, y+1)
        tryTeleport(x-3, y-2)
        tryTeleport(x-3, y+2)
        tryTeleport(x-4, y)
        tryTeleport(x-3, y)
    }
}

startSpecialWaitCan = function() {
    if (turn == 1) wait()
    if (turn <= 3) m(x-1, y)
    if (turn == 4) activateSensors()
    if (turn == 5) reflect()
    if (turn == 6) zap()
}

startSpecialKaiznn = function() {
    if (turn == 1) reflect()
    if (turn == 2) m(x+1, y)
    if (turn <= 5) m(x-1, y)
}

startSpecialRonThing = function() {
    if (turn == 1) reflect()
    if (turn == 2) m(x+1, y)
    if (turn == 3) {
        if (x >= xCPU-5) {
            zap()
        } else {
            wait()
        }
    }
    if (turn == 4) {
        if (x >= xCPU-5) {
            tryTeleport(xCPU-1, y)
            tryTeleport(xCPU-1, y-1)
            tryTeleport(xCPU-1, y+1)
            tryTeleport(xCPU-2, y+1)
            tryTeleport(xCPU-2, y-1)
            probablyTeleportToBestOffensiveTeleportLocation()
        } else {
            wait()
        }
    }
    if (turn <= 6 && x < xCPU-5) {
        m(x-1, y)
    }
    if (turn == 7 && x < xCPU-5) {
        wait()
    }
}

/*************************************************** FORWARD MINES **********************************************************/

/*

startSpecialForwMines = function() {

    if (!mode) mode = MODE_MINES_FORWARD
    if (turn > 30) mode = MODE_NORMAL // in case we fail to lure the enemy in
    if (mode == MODE_NORMAL) return

    if (mode == MODE_MINES_FORWARD) {
        if (currDistToClosestBot <= 2 && !canLayMine()) {
            triggerCoordinatedTeleport()
        }
        if (currDistToClosestBot <= 1) {
            triggerCoordinatedTeleport()
        }
        if (coordinatedTeleportTriggered()) {
            mode = MODE_LURE_THEM_IN
            if (LURE_UP) tryTeleport(startX, startY)
            else {
                tryTeleport(0, y)
                tryTeleport(x-5, y)
            }
            tryDefensiveTeleport()
            n("h")
        }
        if (dmgTaken > 100 && canReflect()) reflect()
        if (canLayMine()) layMine()
        moveIfNoMeleeCardinality(x+1, y)
        wait()
    }
    if (mode == MODE_LURE_THEM_IN) {
        if (currDistToClosestBot <= 2) {
            if (!sharedD) sharedD = turn
            if (canZap()) zap()
        }
        if (sharedD && turn >= sharedD+3) {
            mode = MODE_NORMAL
            normalActions()
        }
        if (dmgTaken > 100 && canReflect()) reflect()
        if (LURE_UP && y>0) {
            if (canLayMine()) layMine()
            m(x, y-1)
        }
        tryMelee(x+1, y)
        tryMelee(x, y+1)
        tryMelee(x, y-1)
        tryMelee(x-1, y)
        if (canLayMine()) layMine()
        wait()
    }
}

tryDefensiveTeleport = function() {
    // Only tele to 4 dist because we want the enemy to see us and walk through mines.
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

*/

/*************************************************** . **********************************************************/

fight = function() {
    maybeFinishOff(target)
    if (reflectAllowed()) reflect()
    if (ALTERNATE_REFLECT_CLOAK && !isReflecting() && canCloak()) cloak()
    maybeZap(target);
    maybeTeleportIntoEnemies(target);

    if (willMeleeHit(target)) {
        melee(target);
    }
    m(target); // TODO try to gain cardinality to charge?
}

goAfterCPUandChips = function() {
    target = findEntity(ENEMY, CHIP | CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (!exists(target)) {
        maybeSensors()
        moveTo(xCPU, yCPU)
    }
    if (willMeleeHit(target)) {
        melee(target)
    }
    moveTo(target)
}

zapAllowed = function() {
    return (turn >= ZAP_ALLOWED_FROM_TURN);
}

teleportAllowed = function() {
    return (turn >= TELEPORT_ALLOWED_FROM_TURN)
}

sensorsAllowed = function() {
    return (turn >= SENSORS_ALLOWED_FROM_TURN)
}

// Choose target primarily based on who we can melee, secondarily by distance, third by life.
chooseTarget = function() {
    bestScore = -999999999
    bestEntity = null
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        lifeE = getLife(array1[i])
        canMeleeE = willMeleeHit(array1[i])
        dx = abs(ex - x)
        dy = abs(ey - y)
        distE = dx+dy

        scoreE = 0;
        if (canMeleeE) scoreE += 100000 // good if we can melee
        scoreE -= 10000*distE // bad if high distance
        scoreE -= lifeE // bad if high life

        if (scoreE > bestScore) {
            bestScore = scoreE
            bestEntity = array1[i]
        }
    }
    // TODO when choosing target for teleport make sure we choose a target where WE HAVE SPACE TO TELEPORT NEXT TO!!!
    if (!exists(bestEntity)) {
        // TODO alarm target set by other units?
    }
    return bestEntity;
}

// TODO regroup: move all units back to initial formation, using teleports if possible
// TODO use teleport here?

maybeSensors = function() {
    if (sensorsAllowed() && canActivateSensors()) {
        activateSensors();
    }
}

maybeFinishOff = function(target) {
    if (getLife(target) <= 550 && willMeleeHit(target)) {
        melee(target);
    }
}

maybeZap = function(target) {
    if (zapAllowed() && canZap() && life > 1100) {
        if (distanceTo(target) <= 3) {
            zap();
        }
        if (distanceTo(target) <= 5 && canTeleport()) {
            // Why 5? We could teleport next to a bot at distance 6, but we are likely to get a better teleport location (by virtue of having more options) if we are a bit closer.
            zap();
        }
    }
}

scoreOffensiveTeleportLocation = function(cx, cy) {
    score = 0;

    score += 1000*countEnemyBotsWithinDist(cx, cy, 1, 1);
    score += 300*countEnemyBotsWithinDist(cx, cy, 2, 2); // zapper does 50% dmg to diagonally adjacent enemies. note that this also gives score for cardinally dist2 enemies (TODO fix that).

    // TODO some score for chips and cpus (but only if there are also bots to hurt!)

    // small bias towards right, tiny bias towards vertical center
    score += 5*cx;
    score -= 2*abs(y - (arenaHeight/2 - 1));

    return score;
}

probablyTeleportToBestOffensiveTeleportLocation = function() {
    bestX = x;
    bestY = y;
    bestScore = -99999;
    for (cx=x-5; cx<=x+5; cx++) {
        for (cy=y-5; cy<=y+5; cy++) {
            if (canActuallyTeleport(cx, cy)) {
                score = scoreOffensiveTeleportLocation(cx, cy);
                if (score > bestScore) {
                    bestScore = score;
                    bestX = cx;
                    bestY = cy;
                }
            }
        }
    }
    if (bestScore >= 1000) tryTeleport(bestX, bestY);
}

maybeTeleportIntoEnemies = function(target) {
    if (!isZapping()) {
        // Do not teleport without zap!
        return;
    }
    if (OFFENSIVE_TELEPORT_ALLOWED && teleportAllowed() && canTeleport() && distanceTo(target) >= 3 && distanceTo(target) <= 5) {
        probablyTeleportToBestOffensiveTeleportLocation();
    }
}

