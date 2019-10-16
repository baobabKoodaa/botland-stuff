moveTowards = function(cx, cy) {
    moveTo(cx, cy)
}

outOfBounds = function(cx, cy) {
    return (cx < 0 || cy < 0 || cx >= arenaWidth || cy >= arenaHeight);
}

reflectAllowed = function() {
    return (turn >= REFLECT_ALLOWED_FROM_TURN && canReflect())
}

canActuallyTeleport = function(cx, cy) {
    // The canTeleport method doesnt check if there is an entity at target location!
    return (canTeleport(cx, cy) && !getEntityAt(cx, cy))
}

tryTeleport = function(cx, cy) {
    if (canActuallyTeleport(cx, cy)) teleport(cx, cy)
}

triggerCoordinatedTeleport = function() {
    sharedC = turn
}

coordinatedTeleportTriggered = function() {
    if (sharedC == turn) return true
    if (sharedC == turn-1) return true // sometimes we act just before a teammate coordinates teleport, so we jump next turn
    return false
}

tryMoveTo = function(cx, cy) {
    if (canMoveTo(cx, cy)) moveTo(cx, cy);
}

inMeleeOrEnemyEnclosing = function() {
    if (currDistToClosestBot <= 1) return true;
    if (currDistToClosestBot <= 2 && currDistToClosestBot < prevDistToClosestBot) return true;
    return false;
}

tryToBreakCardinality = function() {
    // Try to break cardinality (to prevent lasers & charging) (also: any move somewhat protects from artillery)
    // TODO Rework this function (it is not used atm)
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
}

// Returns number of enemy bots between minDist, maxDist (inclusive, both) (that we can sense).
enemyBotsWithinDist = function(cx, cy, minDist, maxDist) {
    c = 0;
    array1 = findEntities(ENEMY, BOT, false);
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i]);
        ey = getY(array1[i]);
        dx = abs(ex - cx);
        dy = abs(ey - cy);
        if (dx+dy >= minDist && dx+dy <= maxDist) c += 1;
    }
    return c;
}

distToClosestEnemyBot = function(cx, cy) {
    lowestDist = 999;
    array1 = findEntities(ENEMY, BOT, false);
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i]);
        ey = getY(array1[i]);
        dx = abs(ex - cx);
        dy = abs(ey - cy);
        if (dx+dy < lowestDist) lowestDist = dx+dy;
    }
    return lowestDist;
}

friendlyBotsWithinDist = function(cx, cy, minDist, maxDist) {
    c = 0;
    array1 = findEntities(IS_OWNED_BY_ME, BOT, false);
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i]);
        ey = getY(array1[i]);
        dx = abs(ex - cx);
        dy = abs(ey - cy);
        if (dx+dy >= minDist && dx+dy <= maxDist) c += 1;
    }
    return c;
}

// Returns 1 if we can fire lasers at any enemy bot from given coordinates.
canFireLasers = function(cx, cy) {
    array1 = findEntities(ENEMY, BOT, false);
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i]);
        ey = getY(array1[i]);
        dx = abs(ex - cx);
        dy = abs(ey - cy);
        if (dx+dy <= 5) {
            if (ex == cx) return 1;
            if (ey == cy) return 1;
        }
    }
    return 0;
}















