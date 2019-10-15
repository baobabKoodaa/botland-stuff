init = function() {

    DODGE_ARTILLERY = 1

    FORWARD_MINE_ATTACKS = 0;
    SS_BACKWARD_MINES = 0;
    SS_BACKWARD_LEFT = 1;

    SS_REFLECT_TURN = 0;


    REFLECT_ALLOWED_FROM_TURN = 4;

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


    countForwardMineAttacks = 0;
    countBackwardMineAttacks = 0;
    forwardMinesState = 0;
    lastMineLayTurn = -1000;

    commonInitProcedures();
}

update = function () {
    commonStateUpdates()
    updateHeatmap()
    specialActions()
    normalActions()

};

specialActions = function() {
    if (turn == SS_REFLECT_TURN && canReflect()) reflect()

    d = distToClosestEnemyBot(x, y)
    if (FORWARD_MINE_ATTACKS) {
        // Start/continue laying forward mines if we don't see enemies
        if (d > 5 && forwardMinesState == 0 && countForwardMineAttacks < FORWARD_MINE_ATTACKS) {
            forwardMinesState += 1;
            countForwardMineAttacks += 1;
        }

        if (forwardMinesState == 1) {
            if (reflectAllowed() && canReflect()) reflect();
            if (canTeleport()) {
                if (d >= 3) {
                    if (canLayMine()) layMine();
                    if (canMove('right')) move('right');
                } else {
                    forwardMinesState = 2;
                    if (canTeleport(x-4, y)) teleport(x-4, y)
                    if (canTeleport(x-3, y)) teleport(x-3, y)
                    if (canTeleport(x-2, y-2)) teleport(x-2, y-2)
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

    if (SS_BACKWARD_MINES) {
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
    }
}




normalActions = function() {
    // If we don't see anything, then move towards the CPU
    closestEnemy = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (!exists(closestEnemy)) {
        moveTo(arenaWidth-2, (arenaHeight-1)/2);
    }

    // If we can see at least one enemy bot somewhere
    closestBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(closestBot)) {

        xe = getX(closestBot)
        ye = getY(closestBot)

        // Maybe zap
        if (canZap() && currDistToClosestBot == 1 && currLife > 1000 && getLife(closestBot) > 750) {
            zap()
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
        // Maybe lure enemy into mine that we are standing on //TODO break cardinality here or not?
        if (currDistToClosestBot <= 1 && !canLayMine()) {
            if (x == xe+1) {
                tryMoveTo(x+1, y)
            }
            if (x == xe-1) {
                tryMoveTo(x-1, y)
            }
            if (y == ye+1) {
                tryMoveTo(x, y+1)
            }
            if (y == ye-1) {
                tryMoveTo(x, y-1)
            }
            // else desired direction is blocked
        }
        if (reflectAllowed() && canReflect()) {
            reflect()
        }

        // If we took damage last turn, try to evade somehow (-50 because splash damage is ok)
        if (isLocationHot(x, y)) {
            // Cooldown for evade so we dont waste all our turns evading. This is more crucial to midranger compared to outranger,
            // because midranger will end up in missile vs missile/laser fights, whereas outranger can actually outrange opponents.
            if (turn >= lastDodgeTurn+DODGE_COOLDOWN) {
                lastDodgeTurn = turn
                probablyDodge()
            }
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

        // Fallback to pursuing closest bot
        pursue(closestBot);
    }

    // If we can see enemy chip or cpu, but no bot
    if (willMissilesHit()) {
        fireMissiles();
    }
    pursue(closestEnemy); // chip of cpu
}