scoreDodgeLocation = function(cx, cy) {
    if ((cx != x || cy != y) && !canMoveTo(cx, cy)) return -99999999;

    s = 0;

    // Distance: different bots prefer different distance to closest enemy.
    dc = distToClosestEnemyBot(cx, cy);
    if (dc >= 7) s-= DODGE_PENALTY_DIST_7
    if (dc == 6) s-= DODGE_PENALTY_DIST_6
    if (dc == 5) s-= DODGE_PENALTY_DIST_5
    if (dc == 4) s-= DODGE_PENALTY_DIST_4 // TODO make outranger favor missile vs missile combat when its reflectors are on, but make sure we dont hurt midranger's behavior with that
    if (dc == 3) s-= DODGE_PENALTY_DIST_3
    if (dc == 2) s-= DODGE_PENALTY_DIST_2
    if (dc == 1) s-= DODGE_PENALTY_DIST_1

    // Cardinality: our dodging bots do not have strong laser/melee abilities,
    // so we want to avoid cardinality and prefer diagonality - unless reflectors are on! In that case we want cardinality!
    if (cardinalToClosestEnemyBot(cx, cy)) {
        cardinalityExtra = 0;
        if (dc == 5) cardinalityExtra = DODGE_PENALTY_DIST_5_CARDINALITY_EXTRA
        if (dc == 4) cardinalityExtra = DODGE_PENALTY_DIST_4_CARDINALITY_EXTRA
        if (dc == 3) cardinalityExtra = DODGE_PENALTY_DIST_3_CARDINALITY_EXTRA
        if (dc == 2) cardinalityExtra = DODGE_PENALTY_DIST_2_CARDINALITY_EXTRA // TODO deal with melee charge risk
        if (isReflecting()) s += cardinalityExtra
        else s -= cardinalityExtra
    }

    // Avoid moving to areas where many enemy bots might attack us
    desiredCountNearbyEnemies = 1
    actualCountNearbyEnemies = countEnemyBotsWithinDist(cx, cy, 1, 4)
    if (actualCountNearbyEnemies > desiredCountNearbyEnemies) {
        s -= actualCountNearbyEnemies - desiredCountNearbyEnemies
    }

    // Avoid edges of the map
    if (cx == 0 || cy == 0 || cx == arenaWidth-1 || cy == arenaHeight-1) {
        s -= DODGE_PENALTY_EDGE_OF_MAP
    }

    // Avoid moving next to friendly bots
    s -= 1*friendlyBotsWithinDist(cx, cy);

    if (DODGE_ARTILLERY) {
        s -= 1*getLocationHeat(cx, cy);
    }

    return s;
}

cardinalToClosestEnemyBot = function(cx, cy) {
    lowestDist = 999
    isCardinal = false
    array1 = findEntities(ENEMY, BOT, false)
    for (i=0; i<size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        dx = abs(ex - cx)
        dy = abs(ey - cy)
        if (dx+dy < lowestDist) {
            lowestDist = dx+dy
            if (dx == 0 || dy == 0) isCardinal = true;
            else isCardinal = false;
        }
    }
    return isCardinal
}

willAnyWeaponHitAnyBot = function() {
    array1 = findEntities(ENEMY, BOT, false);
    for (i = 0; i < size(array1); i++) {
        if (willArtilleryHit(array1[i])) return true;
        if (willLasersHit(array1[i])) return true;
        if (willMissilesHit(array1[i])) return true;
        if (willMeleeHit(array1[i])) return true;
    }
    return false;
}

// If we can do something useful, wasting our action on a move has some cost.
estimateActionCost = function() {
    if (willAnyWeaponHitAnyBot()) return 3;
    if (reflectAllowed()) return 1;
    return 0;
}

probablyDodge = function() {
    // Score our options.
    actionCost = estimateActionCost();
    scoreUp = scoreDodgeLocation(x, y-1) - actionCost;
    scoreDown = scoreDodgeLocation(x, y+1) - actionCost;
    scoreLeft = scoreDodgeLocation(x-1, y) - actionCost;
    scoreRight = scoreDodgeLocation(x+1, y) - actionCost;
    scoreCurrent = scoreDodgeLocation(x, y); // No actionCost here, because if we stay, we get to act.

    debugLog('T' + turn + ' x' + x + ' y' + y + ' u' + scoreUp + ' d' + scoreDown + ' l' + scoreLeft + ' r' + scoreRight + ' c' + scoreCurrent + '');

    // Choose best score, break ties with a directional preference: vertical > left > right
    scoreBest = max(scoreCurrent, scoreUp, scoreDown, scoreLeft, scoreRight)
    if (scoreUp == scoreBest) move('up')
    if (scoreDown == scoreBest) move('down')
    if (scoreLeft == scoreBest) move('left')
    if (scoreRight == scoreBest) move('right')
    // when scoreCurrent is best we fall through
}