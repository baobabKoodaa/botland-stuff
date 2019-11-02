//!import dodging
//!import heatmap
//!import state
//!import utils

init = function() {

    DODGE_ARTILLERY = 1

    FORWARD_MINE_ATTACKS = 0
    SS_BACKWARD_MINES = 0
    SS_BACKWARD_LEFT = 2

    SS_REFLECT_TURN = 0
    REFLECT_ALLOWED_FROM_TURN = 1

    REPAIR_AVAILABLE = 0
    REPAIR_X = 0
    REPAIR_Y = 0

    currentlyRetreatingToRepair = 0
    waitingForFriendsToRepair = 0


    DODGE_COOLDOWN = 2;
    DODGE_PENALTY_DIST_7 = 3
    DODGE_PENALTY_DIST_6 = 3
    DODGE_PENALTY_DIST_5 = 3
    DODGE_PENALTY_DIST_4 = 0
    DODGE_PENALTY_DIST_3 = 1
    DODGE_PENALTY_DIST_2 = 4
    DODGE_PENALTY_DIST_1 = 10
    DODGE_PENALTY_DIST_5_CARDINALITY_EXTRA = 1 // lvl3 lasers are not that common + we have high penalty for 5+ dist anyway
    DODGE_PENALTY_DIST_4_CARDINALITY_EXTRA = 2 // no difference between 4 and 3 dist cardinality; same threat to us in both
    DODGE_PENALTY_DIST_3_CARDINALITY_EXTRA = 2
    DODGE_PENALTY_DIST_2_CARDINALITY_EXTRA = 4 // melee charge cardinality in addition to laser!
    DODGE_PENALTY_EDGE_OF_MAP = 1

    countForwardMineAttacks = 0
    countBackwardMineAttacks = 0
    forwardMinesState = 0
    lastMineLayTurn = -1000

    commonInitProcedures()
    initializeHeatmap()
}

update = function () {
    commonStateUpdates()


    updateHeatmap()

    debugLog("turn", turn, "id", id, "life", life, "x", x, "y", y, "hot?", isLocationHot(x, y))
    maybeRepair()
    specialActions()
    normalActions()
}

specialActions = function() {
    if (turn == SS_REFLECT_TURN && canReflect()) reflect()

    d = distToClosestEnemyBot(x, y)
    if (FORWARD_MINE_ATTACKS && probablyHasLandMines()) {
        // Start/continue laying forward mines if we don't see enemies
        if (d > 5 && forwardMinesState == 0 && countForwardMineAttacks < FORWARD_MINE_ATTACKS) {
            forwardMinesState += 1
            countForwardMineAttacks += 1
        }

        if (coordinatedTeleportTriggered()) {
            forwardMinesState = 2
            tryDefensiveTeleport()
        }

        if (forwardMinesState == 1) {
            if (d <= 5 && reflectAllowed()) reflect()
            if (canTeleport()) {
                if (d < 3) {
                    forwardMinesState = 2
                    triggerCoordinatedTeleport()
                    tryDefensiveTeleport()
                }
                if (d >= 3) {
                    if (canLayMine()) layMine();
                    if (canMove('right')) move('right');
                }
            } else {
                if (d >= 5) {
                    if (canLayMine()) layMine();
                    if (canMove('right')) move('right');
                } else {
                    forwardMinesState = 2;
                    if (canLayMine()) layMine();
                    if (canMove('left')) move('left');
                }
            }

        }
        if (forwardMinesState == 2) {
            if (d <= 3 && canMove('left')) move('left')
            if (d <= 4 && willMissilesHit()) fireMissiles()
            if (d >= 5) {
                if (canLayMine()) layMine()
                if (canActivateSensors()) activateSensors()
                else forwardMinesState = 0
            }
        }
    }

    if (SS_BACKWARD_MINES && probablyHasLandMines()) {
        lastMineTurn = 2*SS_BACKWARD_MINES - 1
        lastLeftTurn = lastMineTurn + SS_BACKWARD_LEFT
        if (turn <= lastMineTurn) {
            if (canLayMine()) {
                layMine();
            }
        }
        if (turn <= lastLeftTurn) {
            if (canMove('left')) move('left');
        }
        if (turn == lastLeftTurn+1) {
            // prevent whipsawing back to right
            if (willMissilesHit()) fireMissiles()
            if (canLayMine()) layMine()
            if (canActivateSensors()) activateSensors()
            return
        }
    }
}

tryDefensiveTeleport = function() {
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

inDanger = function() {
    if (currLife < 600 && isReflecting()) return true
    if (currLife < 900 && !isReflecting()) return true
    return false
}

maybeRepair = function() {
    if (REPAIR_AVAILABLE) {
        distToRepair = getDistanceTo(REPAIR_X, REPAIR_Y)
        if (inDanger() && distToRepair > 5) {
            // Triggering retreat to repair
            currentlyRetreatingToRepair = true
        }
        if (distToRepair <= 5 && currDistToClosestBot <= 5) { // TODO replace this with coordinated shared variable
            // Enemies followed us to repair, fight them now
            currentlyRetreatingToRepair = false
            waitingForFriendsToRepair = false
        }
        if (currentlyRetreatingToRepair) {
            if (distToRepair > 1) {
                // Retreating towards repair
                maybeDodge()
                if (canCloak() && !isCloaked()) {
                    cloak()
                }
                // Try to move towards the 'corner' of repair-man
                if (x > REPAIR_X+1) tryMoveTo(x-1, y)
                if (x < REPAIR_X-1) tryMoveTo(x+1, y)
                if (y > REPAIR_Y+1) tryMoveTo(x, y-1)
                if (y < REPAIR_Y-1) tryMoveTo(x, y+1)
                // Try to move next to the repair-man
                if (x > REPAIR_X) tryMoveTo(x-1, y)
                if (x < REPAIR_X) tryMoveTo(x+1, y)
                if (y > REPAIR_Y) tryMoveTo(x, y-1)
                if (y < REPAIR_Y) tryMoveTo(x, y+1)
                // Fallback
                if (willMissilesHit()) fireMissiles()
                if (canLayMine()) layMine()
                move()
            } else {
                // We have reached a tile next to repair-man's tile
                if (!getEntityAt(REPAIR_X, REPAIR_Y)) {
                    // Repair-man is dead
                    REPAIR_AVAILABLE = 0
                    currentlyRetreatingToRepair = false
                } else if (currLife < 2000) {
                    // Wait until completely healed
                    if (canActivateSensors()) activateSensors()
                    if (canLayMine()) layMine()
                    move(x, y)
                } else {
                    // We are completely healed
                    currentlyRetreatingToRepair = false
                    lowestHealthNearbyFriendlyBot = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
                    if (exists(lowestHealthNearbyFriendlyBot) && getLife(lowestHealthNearbyFriendlyBot) < 2000) {
                        waitingForFriendsToRepair = true
                    }
                }
            }
        }
        if (waitingForFriendsToRepair) {
            lowestHealthNearbyFriendlyBot = findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING)
            if (exists(lowestHealthNearbyFriendlyBot) && getLife(lowestHealthNearbyFriendlyBot) < 2000) {
                // Still have to wait for some friends to repair. Move out of the way.
                if (y != REPAIR_Y && (x == REPAIR_X+1 || x == REPAIR_X+2)) {
                    tryMoveTo(x-1, y)
                    if (y < yCPU) tryMoveTo(x, y+1)
                    else tryMoveTo(y-1)
                    tryMoveTo(x+1, y)
                }
                if (y == REPAIR_Y) {
                    if (y < yCPU) tryMoveTo(x, y+1)
                    else tryMoveTo(y-1)
                    tryMoveTo(x+1, y)
                }
                if (y < yCPU-1) tryMoveTo(x, y+1)
                if (willMissilesHit()) fireMissiles()
                move(x, y) // wait
            } else {
                // Everyone is repaired, let's fight!
                waitingForFriendsToRepair = false
            }
        }
    }
}

normalActions = function() {

    closestEnemy = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING);

    // If we don't see anything, then move towards the CPU
    if (!exists(closestEnemy)) {
        tryMoveTo(x+1, y)
        if (y > yCPU) tryMoveTo(x, y-1)
        else tryMoveTo(x, y+1)
    }

    // If we can see at least one enemy bot somewhere
    closestBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(closestBot)) {

        xe = getX(closestBot)
        ye = getY(closestBot)

        if (currDistToClosestBot == 1 && canTeleport()) {
            // Try to teleport towards home corner TODO evaluate best defensive teleport target
            tryDefensiveTeleport()
        }

        // Maybe lay mine
        if (canLayMine() && inMeleeOrEnemyEnclosing() && currLife > 550 && x != 0 && y != 0 && x != arenaWidth-1 && y != arenaHeight-1) {
            otherFriendlies = friendlyBotsWithinDist(xe, ye, 2, 2);
            if (otherFriendlies == 0) {
                // Prevent case where 2 midrangers both lay mines and both escape from the same opponent, essentially wasting some actions.
                lastMineLayTurn = turn;
                layMine();
            }

        }
        // Maybe lure enemy into mine that we are standing on //TODO break cardinality here or not? // TODO should we maybeDodge before mineLaying and mineLuring?
        if (currDistToClosestBot <= 1) {

            if (probablyStandingOnMine()) {
                if (x == xe + 1) {
                    tryMoveTo(x + 1, y)
                }
                if (x == xe - 1) {
                    tryMoveTo(x - 1, y)
                }
                if (y == ye + 1) {
                    tryMoveTo(x, y + 1)
                }
                if (y == ye - 1) {
                    tryMoveTo(x, y - 1)
                }
                // else desired direction is blocked
            }
        }

        maybeDodge()

        if (!REPAIR_AVAILABLE) {
            // Alternate between reflect and cloak, with a priority on reflecting.
            if (!isCloaked() && !isReflecting() && reflectAllowed()) {
                reflect()
            }
            if (!isReflecting() && !canReflect() && canCloak() && !isCloaked()) {
                cloak()
            }
        } else {
            // When repair is available, we do NOT want to alternate between reflect and cloak.
            // Instead, we want to use reflect when needed, and spare cloak for escaping.
            if (currDistToClosestBot <= 5 && reflectAllowed()) reflect()
        }


        // Try to fire missiles
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

        moveCloserToEnemiesWithoutSteppingOnHot()
    }

    // If we can see enemy chip or cpu, but no bot
    maybeDodge()
    if (willMissilesHit()) {
        fireMissiles();
    }
    pursue(closestEnemy); // chip or cpu
}

moveCloserToEnemiesWithoutSteppingOnHot = function() {
    frHelper(x, y+1)
    frHelper(x, y-1)
    frHelper(x-1, y)
    frHelper(x+1, y)
}

frHelper = function(cx, cy) {
    if (distToClosestEnemyBot(cx, cy) < distToClosestEnemyBot(x, y) && !isLocationHot(cx, cy)) {
        moveTo(cx, cy)
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