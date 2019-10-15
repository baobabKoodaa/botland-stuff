init = function() {

    SENSORS_ALLOWED_FROM_TURN = 1;
    TELEPORT_ALLOWED_FROM_TURN = 2;
    REFLECT_ALLOWED_FROM_TURN = 1;
    ZAP_ALLOWED_FROM_TURN = 1;

    commonInitProcedures();
};

update = function() {

    commonStateUpdates()

    target = chooseTarget();
    if (!exists(target)) {
        maybeSensors();
        maybeRetreatForCooldowns();
        moveTo(xCPU, yCPU);
    }
    maybeFinishOff(target);
    maybeReflect();
    maybeZap(target);
    maybeTeleportIntoEnemies(target);

    if (willMeleeHit(target)) {
        melee(target);
    }
    moveTo(target); // TODO try to gain cardinality to charge?

};

zapAllowed = function() {
    return (turn >= ZAP_ALLOWED_FROM_TURN);
}

reflectAllowed = function() {
    return (turn >= REFLECT_ALLOWED_FROM_TURN)
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
    if (!exists(bestEntity)) {
        bestEntity = findEntity(ENEMY, CHIP | CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
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

maybeReflect = function() {
    if (reflectAllowed() && canReflect() && inDanger()) {
        reflect();
    }
}

maybeRetreatForCooldowns = function() {
    if (!canZap() || !canTeleport()) move('left');
}

maybeFinishOff = function(target) {
    if (getLife(target) <= 550 && willMeleeHit(target)) {
        melee(target);
    }
}

maybeZap = function(target) {
    if (zapAllowed() && canZap()) {
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

    score += 1000*enemyBotsWithinDist(cx, cy, 1, 1);
    score += 300*enemyBotsWithinDist(cx, cy, 2, 2); // zapper does 50% dmg to diagonally adjacent enemies. note that this also gives score for cardinally dist2 enemies (TODO fix that).

    // TODO some score for chips and cpus

    // small bias towards right, tiny bias towards vertical center
    score += 5*cx;
    score -= 2*abs(y - (arenaHeight/2 - 1));

    return score;
}

teleportToBestOffensiveTeleportLocation = function() {
    bestX = x;
    bestY = y;
    bestScore = -99999;
    for (cx=x-5; cx<=x+5; cx++) {
        for (cy=y-5; cy<=y+5; cy++) {
            dx = abs(cx - x);
            dy = abs(cy - y);
            dist = dx + dy;
            if (canTeleport(cx, cy)) {
                score = scoreOffensiveTeleportLocation(cx, cy);
                if (score > bestScore) {
                    bestScore = score;
                    bestX = cx;
                    bestY = cy;
                }
            }
        }
    }
    teleport(bestX, bestY);
}

maybeTeleportIntoEnemies = function(target) {
    if (!isZapping()) {
        // Do not teleport without zap!
        return;
    }
    if (teleportAllowed() && canTeleport() && distanceTo(target) >= 3 && distanceTo(target) <= 5) {
        teleportToBestOffensiveTeleportLocation();
    }
}

