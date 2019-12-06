//!import state
//!import utils

// This didn't work out too well.

init = function() {

    commonInitProcedures()

    goalX = x+8
    goalY = y

    MODE_ESCAPE = -1
    MODE_FIND_TARGET = 1
    MODE_KILL_TARGET = 2
    mode = MODE_KILL_TARGET
}

update = function () {
    commonStateUpdates()

    //debugLog('turn', turn, 'x', x, 'y', y, 'dist', currDistToClosestBot)

    // Special to burn sensor cooldowns from enemy front liners
    if (turn <= 2) w()

    if (currDistToClosestBot < 5) mode = MODE_ESCAPE
    if (mode == MODE_ESCAPE) tryToEscape()
    if (mode == MODE_FIND_TARGET) tryToFindAnEnemy()
    if (mode == MODE_KILL_TARGET) tryToSneakOnTarget()
}

tryToFindAnEnemy = function() {
    refreshGoal()
    if (!areSensorsActivated() && !isCloaked()) {
        if (canActivateSensors()) activateSensors()
        w()
    }
    m(x+1, y)
}

refreshGoal = function() {
    closestEnemy = findClosestEnemyBot()
    if (exists(closestEnemy)) {
        ex = getX(closestEnemy)
        ey = getY(closestEnemy)
        if (ex != goalX || ey != goalY) {
            oldEnemy = getEntityAt(goalX, goalY)
            if (!exists(oldEnemy) || getDistanceTo(ex, ey) < getDistanceTo(goalX, goalY)) {
                goalX = ex
                goalY = ey
                mode = MODE_KILL_TARGET
                tacticalRetreat()
            }
        }
    }
}

tryToSneakOnTarget = function() {
    refreshGoal()

    gd = getDistanceTo(goalX, goalY)
    if (gd == 8) {
        if (!canCloak()) w()
        m(x+1, y)
    }
    /*
    if (gd == 7) {
        m(x+1, y)
    }
    if (gd == 6) {
        if (!isCloaked() && canCloak()) cloak()
        m(x+1, y)
    }*/
    if (gd == 7) {
        if (!isCloaked() && canCloak()) cloak()
        m(x+1, y)
    }
    if (gd == 6) {
        m(x+1, y)
    }
    if (gd == 5) {
        if (currDistToClosestBot == 5) {
            // We can see the enemy that we expected to be there
            if (isCloaked()) {
                target = getEntityAt(x+5, y)
                if (willLasersHit(target)) fireLasers()
                if (willLasersHit()) fireLasers()
            }
            tacticalRetreat()
        } else {
            mode = MODE_FIND_TARGET
            tryToFindAnEnemy()
        }
    }
}

tryToEscape = function() {
    if (x == 0 && currDistToClosestBot > 5) {
        mode = MODE_FIND_TARGET
    }
    t(x-4, y+1)
    t(x-4, y-1)
    t(x-3, y+2)
    t(x-3, y+2)
    t(x-5, y)
    t(x-2, y+3)
    t(x-2, y+3)
    t(x-1, y+4)
    t(x-1, y+4)
    if (canCloak()) cloak()
    if (countEnemyBotsWithMeleeCardinality(x, y) > 0) {
        if (!isCloaked() && willLasersHit()) fireLasers()
    }
    moveIfNoMeleeCardinality(x-1, y)
    moveIfNoMeleeCardinality(x, y+1)
    moveIfNoMeleeCardinality(x, y-1)
    moveIfNoMeleeCardinality(x+1, y)
}

tacticalRetreat = function() {
    t(goalX-8, goalY)
    t(goalX-7, goalY)
    t(goalX-9, goalY)
    t(goalX-8, goalY-1)
    t(goalX-8, goalY+1)
}