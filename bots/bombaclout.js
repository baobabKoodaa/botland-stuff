init = function () {
    FIRE1 = 1;
    FIRE2 = 2;
    // Sensor cooldown is 3 turns + wait for enemy artillery to land
    BACKWARD1 = 3;
    BACKWARD2 = 4;
    BACKWARD3 = 5;
    FORWARD1 = 6;
    FORWARD2 = 7;
    SENSORS = 8;
    FORWARD3 = 9;
    state = SENSORS;
};

update = function() {

    if (state > FORWARD3) {
        state = FIRE1;
    }

    xCPU = arenaWidth-2;
    yCPU = (arenaHeight-1)/2;

    if (state == FIRE1 || state == FIRE2) {
        state += 1

        // Can we see an en enemy?
        closestEnemy = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
        if (exists(closestEnemy)) {
            xe = getX(closestEnemy)
            ye = getY(closestEnemy)

            // If enemy is closing in on us
            if (distanceTo(closestEnemy) <= 2) {

                // Maybe lay mine
                if (canLayMine() && life > 550 && x != 0 && y != 0 && x != arenaWidth-1 && y != arenaHeight-1) {
                    lastMineLayTurn = turn;
                    layMine();
                }

                // Maybe lure enemy into mine that we are standing on
                if (distanceTo(closestEnemy) <= 1 && !canLayMine()) {
                    if (x == xe+1 && canMoveTo(x+1, y)) {
                        moveTo(x+1, y)
                    }
                    if (x == xe-1 && canMoveTo(x-1, y)) {
                        moveTo(x-1, y)
                    }
                    if (y == ye+1 && canMoveTo(x, y+1)) {
                        moveTo(x, y+1)
                    }
                    if (y == ye-1 && canMoveTo(x, y-1)) {
                        moveTo(x, y-1)
                    }
                    // else desired direction is blocked
                }
            }

            // If closest enemy is within missile/laser distance
            if (distanceTo(closestEnemy) <= 4) {
                // Try to activate reflector.
                if (canReflect()) {
                    reflect();
                }
                // Try to fire missiles at enemy.
                if (willMissilesHit(closestEnemy)) {
                    fireMissiles(closestEnemy);
                }
            }

            // If we can see closest enemy at 5-7 tiles away, fire artillery.
            if (willArtilleryHit(closestEnemy)) {
                fireArtillery(closestEnemy);
            }
        }

        // We can not see enemy bots. Activate sensors.
        if (canActivateSensors()) {
            activateSensors();
        }

        // We still can not see enemy bots even with sensors. Can we fire on cpu?
        cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
        if (willArtilleryHit(cpu)) {
            fireArtillery(cpu);
        }

        // We can not see enemy bots, can not fire on CPU either, even though we have sensors on. Move towards CPU.
        if (x < xCPU && canMove('right')) {
            move('right');
        }
        if (y < yCPU && canMoveTo(x, y+1)) {
            moveTo(x, y+1);
        }
        if (y > yCPU && canMoveTo(x, y-1)) {
            moveTo(x, y-1);
        }

    }

    if (state == BACKWARD1 || state == BACKWARD2 || state == BACKWARD3) {
        state += 1
        move('left');
    }
    if (state == SENSORS) {
        state += 1;
        closestEnemy = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
        if (!exists(closestEnemy) && canActivateSensors()) {
            activateSensors();
        } else {
            // skip this state with fallthrough
        }
    }
    if (state == FORWARD1 || state == FORWARD2 || state == FORWARD3) {
        state += 1
        closestEnemy = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
        if (exists(closestEnemy) && distanceTo(closestEnemy) <= 7) {

            // If closest enemy is within missile/laser distance
            if (distanceTo(closestEnemy) <= 4) {
                // Try to activate reflector.
                if (canReflect()) {
                    reflect();
                }
                // Try to fire missiles at enemy.
                if (willMissilesHit(closestEnemy)) {
                    fireMissiles(closestEnemy);
                }
            }
            if (willArtilleryHit(closestEnemy)) {
                fireArtillery(closestEnemy);
            }
            if (randInt(0, 2) == 0) {
                move('up');
            } else {
                move('down');
            }

        }
        // The usual case.
        move('right');
    }


};