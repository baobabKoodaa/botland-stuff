outOfBounds = function(cx, cy) {
    return (cx < 0 || cy < 0 || cx >= arenaWidth || cy >= arenaHeight);
}

tryMoveTo = function(cx, cy) {
    if (canMoveTo(cx, cy)) moveTo(cx, cy);
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
        if (dx+dy >= minDist && dx+dy <= maxDist) c += 1;
    }
    return c;
}

distToClosestEnemyBot = function(cx, cy) {
    lowestDist = 999;
    array1 = findEntities(ENEMY, BOT, false);
    for (i = 0; i < size(array1); i++) {
        e = array1[i];
        ex = getX(e);
        ey = getY(e);
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
        e = array1[i];
        ex = getX(e);
        ey = getY(e);
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
        e = array1[i];
        ex = getX(e);
        ey = getY(e);
        dx = abs(ex - cx);
        dy = abs(ey - cy);
        if (dx+dy <= LASER_RANGE) {
            if (ex == cx) return 1;
            if (ey == cy) return 1;
        }
    }
    return 0;
}















