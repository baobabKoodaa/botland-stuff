init = function() {
    initializeSharedVariables();
    assignId();

    turn = 0;
    prevLife = 2000;

    xCPU = arenaWidth-2;
    yCPU = (arenaHeight-1)/2

    SENSORS_ALLOWED_FROM_TURN = 1;
    TELEPORT_ALLOWED_FROM_TURN = 2;
    REFLECT_ALLOWED_FROM_TURN = 1;
    ZAP_ALLOWED_FROM_TURN = 1;
};

initializeSharedVariables = function() {
    if (!exists(sharedA)) sharedA = 0; // Next free id
}

assignId = function() {
    id = sharedA;
    sharedA += 1;
};

zapAllowed = function() {
    return (turn >= ZAP_ALLOWED_FROM_TURN);
}

reflectAllowed = function() {
    return (turn >= REFLECT_ALLOWED_FROM_TURN);
}

teleportAllowed = function() {
    return (turn >= TELEPORT_ALLOWED_FROM_TURN);
}

sensorsAllowed = function() {
    return (turn >= SENSORS_ALLOWED_FROM_TURN);
}

// Returns number of enemy bots between minDist, maxDist (inclusive, both) (that we can sense).
enemyBotsWithinDist = function(cx, cy, minDist, maxDist) {
    c = 0;
    array1 = findEntities(ENEMY, BOT, false);
    for (i = 0; i < size(array1); i++) {
        e = array1[i];
        ex = getX(e);
        ey = getY(e);
        dx = abs(ex - cx);
        dy = abs(ey - cy);
        dist = dx + dy;
        if (dist >= minDist && dist <= maxDist) c += 1;
    }
    return c;
}

outOfBounds = function(cx, cy) {
    return (cx < 0 || cy < 0 || cx >= arenaWidth || cy >= arenaHeight);
}

chooseTarget = function() {
    targets = findEntities(ENEMY, BOT, false);
    target = filterEntities(targets, [SORT_BY_DISTANCE, SORT_BY_LIFE], [SORT_ASCENDING, SORT_ASCENDING]);
    if (!exists(target)) {
        // TODO alarm target set by other units?
    }
    if (!exists(target)) {
        target = findEntity(ENEMY, CHIP | CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    }
    return target;
}

inDanger = function() {
    return exists(findClosestEnemyBot());
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
    if (zapAllowed() && canZap() && inDanger()) {
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
    score += 2*abs(y - (arenaHeight/2 - 1));

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
            if (dist >= 3 && canTeleport(cx, cy)) {
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
    if (willMeleeHit(target)) {
        // Do not teleport from one melee into another!
        return;
    }
    if (!isZapping()) {
        // Do not teleport without zap!
        return;
    }
    if (teleportAllowed() && canTeleport() && distanceTo(target) >= 3 && distanceTo(target) <= 5) {
        teleportToBestOffensiveTeleportLocation();
    }
}

update = function() {

    // state updates
    turn += 1;
    actualPrevLife = prevLife;
    prevLife = life;

    // act
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
        melee(target); // TODO what if we can charge at a different enemy than target.
    }
    moveTo(target); // TODO try to gain cardinality to charge?


};