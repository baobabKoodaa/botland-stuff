
init = function() {

    FORWARD_MINE_ATTACKS = 0;

    SS_BACKWARD_MINES = 0;
    SS_BACKWARD_LEFT = 1;

    EVADE_COOLDOWN = 3;
    REFLECT_ALLOWED_FROM_TURN = 4;

    countForwardMineAttacks = 0;
    countBackwardMineAttacks = 0;
    forwardMinesState = 0;
    currLife = 2000;
    turn = 0;
    lastEvadeTurn = -1000;
    lastMineLayTurn = -1000;

}

reflectAllowed = function() {
    return (turn >= REFLECT_ALLOWED_FROM_TURN);
}

/******************************************************************** Special actions ********************************************************************/

specialActions = function() {
    d = distToClosestEnemyBot(x, y)
    if (FORWARD_MINE_ATTACKS) {
        // Start/continue laying forward mines if we are near left side without seeing enemies
        if (x <= 5 && d > 5 && forwardMinesState == 0 && countForwardMineAttacks < FORWARD_MINE_ATTACKS) {
            forwardMinesState = 1;
            countForwardMineAttacks += 1;
        }

        if (forwardMinesState == 1) {
            if (reflectAllowed() && canReflect()) reflect();
            if (d > 5) {
                if (canLayMine()) layMine();
                if (canMove('right')) move('right');
            } else if (d == 5) {
                forwardMinesState = 2;
                if (canLayMine()) layMine();
                if (canMove('left')) move('left');
            } else {
                forwardMinesState = 2;
            }
        }
        if (forwardMinesState == 2) {
            if (!canLayMine() && canMove('left')) move('left');
            else forwardMinesState = 0;
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




/******************************************************************** Normal actions ********************************************************************/

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

        // Maybe lay mine
        if (canLayMine() && currLife > 550 && distanceTo(closestBot) <= 2 && x != 0 && y != 0 && x != arenaWidth-1 && y != arenaHeight-1) {
            otherFriendlies = friendlyBotsWithinDist(xe, ye, 2, 2);
            if (otherFriendlies == 0) {
                // Prevent case where 2 midrangers both lay mines and both escape from the same opponent, essentially wasting some actions.
                lastMineLayTurn = turn;
                layMine();
            }

        }
        // Maybe lure enemy into mine that we are standing on //TODO break cardinality here?
        if (distanceTo(closestBot) <= 1 && !canLayMine()) {
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
            reflect();
        }

        // If we took damage last turn, try to evade somehow (-50 because splash damage is ok)
        if (currLife < prevLife-50) {
            // Cooldown for evade so we dont waste all our turns evading.
            if (turn > lastEvadeTurn+EVADE_COOLDOWN) {
                lastEvadeTurn = turn;
                debugLog("turn", turn, "evading");

                // Try to break cardinality (to prevent lasers) (note that any move also somewhat protects from artillery)
                if (xe == x) { // TODO make sure no other bot has cardinality to our move-to spot either!
                    // Horizontal move might help break cardinality
                    if (randInt(0, 2) == 0) tryMoveTo(x+1, y);
                    tryMoveTo(x-1, y);
                }
                if (ye == y) {
                    // Vertical move might help break cardinality
                    if (randInt(0, 2) == 0) tryMoveTo(x, y+1);
                    tryMoveTo(x, y-1);
                }
                // We do not have cardinality to closest bot. Let's move anyway to avoid artillery.
                if (distanceTo(closestBot) <= 3) tryMoveTo(x-1, y);
                if (randInt(0, 2) == 0) tryMoveTo(x, y+1);
                tryMoveTo(x, y-1);
                tryMoveTo(x+1, y);
            }
        }

        // Try to fire missiles
        if (willMissilesHit()) {
            // Hit lowest health enemy in range
            enemies = findEntitiesInRange(ENEMY, BOT, false, 4);
            lowestHealthEnemy = filterEntities(enemies, [SORT_BY_LIFE], [SORT_ASCENDING]);
            if (willMissilesHit(lowestHealthEnemy)) {
                fireMissiles(lowestHealthEnemy);
            }
            // If for some reason unable to fire missiles on lowest health enemy, fire missile on something else
            if (willMissilesHit()) {
                fireMissiles();
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

update = function () {

    // Update state
    turn += 1;
    prevLife = currLife;
    currLife = life;

    specialActions();
    normalActions();

};