init = function() {

    SENSORS_ALLOWED_FROM_TURN = 1;
    TELEPORT_ALLOWED_FROM_TURN = 2;
    REFLECT_ALLOWED_FROM_TURN = 1;
    ZAP_ALLOWED_FROM_TURN = 1;

    commonInitProcedures();

    if (!exists(sharedE)) {
        sharedE = 0 // x of the right-most known enemy
    }
    if (!exists(sharedB)) {
        sharedB = randInt(0, 2)
    }
};

update = function() {

    if (sharedA <= 7) {
        // If at least 2 bots have died, disable left-swarm-in-the-beginning
        sharedE = 13
    }

    commonStateUpdates()
    updateStateOfRightMostKnownEnemy()
    specialActions()
    normalActions()

}

updateStateOfRightMostKnownEnemy = function() {
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        sharedE = max(sharedE, ex)
    }
}

specialActions = function() {
    if (turn <= 2 && sharedB == 0 && sharedE <= 1 && y >= 2 && y <= 8) {
        // Try to disrupt enemy strategy by randomly starting 1/2 matches by moving central units 2 steps back to create a unison line. Only when enemy deployed to the very left.
        if (canMoveTo(x+1, y)) moveTo(x+1, y)
        // Fallback if something weird happened
        if (canReflect()) reflect()
        if (willMeleeHit()) melee()
        move()
    }
    if (turn == 1 && countEnemyBotsWithinDist(x, y, 1, 1) >= 2) {
        flagDanger(x, y)
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
    }
    if (turn == 1 && getEntityAt(10,0)) flagCPUrush()
    if (turn == 1 && getEntityAt(10,arenaHeight-1)) flagCPUrush()
    if (turn == 2 && detectedCPUrush()) {
        //TODO
    }
}

flagCPUrush = function() {
    sharedE = true
}

detectedCPUrush = function() {
    return sharedE
}

flagDanger = function(cx, cy) {
    sharedC = cx
    sharedD = cy
}

targetNearDanger = function(target) {
    if (!sharedC) return
    ex = getX(target)
    ey = getY(target)
    dx = abs(ex - sharedC)
    dy = abs(ey - sharedD)
    if (dx+dy <= 2) return true
    return false
}

normalActions = function() {
    target = chooseTarget();
    if (exists(target)) fight(target)
    else if (sharedE <= 4) {
        goLeft()
    } else if (turn < 25) {
        goHome()
    } else {
        goLeft()
    }
}

fight = function() {
    maybeFinishOff(target)
    if (reflectAllowed() && currDistToClosestBot > 1) reflect()
    if (turn <= 4 && targetNearDanger(target)) {
        // move away from danger at start
        if (x > getX(target)) tryMoveTo(x+1, y)
        if (y > getY(target)) tryMoveTo(x, y+1)
        if (y < getY(target)) tryMoveTo(x, y-1)
    }
    maybeZap(target);
    maybeTeleportIntoEnemies(target);

    if (willMeleeHit(target)) {
        melee(target);
    }
    moveTo(target); // TODO try to gain cardinality to charge?
}

goLeft = function() {
    if (x == 0) sharedE = 5 // if turn<25, then bots who dont see enemies should start moving towards home now
    if (canMoveTo(x-1, y)) moveTo(x-1, y)
    if (y < yCPU && canMoveTo(x, y+1)) moveTo(x, y+1)
    if (y > yCPU && canMoveTo(x, y-1)) moveTo(x, y-1)
}

goHome = function() {
    if (getDistanceTo(xCPU, yCPU) < 2) {
        if (canActivateSensors()) activateSensors()
        move()
    }
    if (x < xCPU-1 && canMoveTo(x+1, y)) moveTo(x+1, y)
    if (y < yCPU-2 && canMoveTo(x, y+1)) moveTo(x, y+1)
    if (y > yCPU+2 && canMoveTo(x, y-1)) moveTo(x, y-1)
    move()
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

retreatTeleport = function() {

    // maximize distance from enemies
    // bonus to left-most
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
        if (distanceTo(target) <= 2) {
            zap();
        }
        if (distanceTo(target) <= 5 && canTeleportNextTo(target)) {
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

canTeleportNextTo = function(target) {
    ex = getX(target)
    ey = getY(target)
    if (canActuallyTeleport(ex+1, y)) return true
    if (canActuallyTeleport(ex-1, y)) return true
    if (canActuallyTeleport(ex, y+1)) return true
    if (canActuallyTeleport(ex, y-1)) return true
    return false
}

probablyTeleportToBestOffensiveTeleportLocation = function() {
    bestX = x
    bestY = y
    bestScore = -99999
    for (cx=x-5; cx<=x+5; cx++) {
        for (cy=y-5; cy<=y+5; cy++) {
            if (canActuallyTeleport(cx, cy)) {
                score = scoreOffensiveTeleportLocation(cx, cy);
                if (score > bestScore) {
                    bestScore = score
                    bestX = cx
                    bestY = cy
                }
            }
        }
    }
    if (bestScore >= 1000) teleport(bestX, bestY)
}

maybeTeleportIntoEnemies = function(target) {
    if (!isZapping()) {
        // Do not teleport without zap!
        return;
    }
    if (teleportAllowed() && canTeleport() && distanceTo(target) >= 3 && distanceTo(target) <= 5) {
        probablyTeleportToBestOffensiveTeleportLocation();
    }
}