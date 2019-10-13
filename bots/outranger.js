

/******************************************************************** Initialization ********************************************************************/

init = function() {
    initializeSharedVariables();
    assignId();

    HEAT_LONGEVITY = 4;
    HEAT_SIT = 30;
    DMG_RESPONSE_THRESHOLD = 61;
    HOTNESS_THRESHOLD = 90;

    turn = 0;
    currLife = 2000;
    currDistToClosestBot = 999;

    LASER_RANGE = 4;
    REFLECT_ALLOWED_FROM_TURN = 1;
    DESTROY_CHIPS_AT_START = true;
};

initializeSharedVariables = function() {
    if (!exists(sharedA)) sharedA = 0; // Next free id
    if (!exists(sharedB)) {
        // Heatmap
        array2 = [];
        array2[0] = 1; // Next free index in heatmap.
        sharedB = array2;
    }
}

assignId = function() {
    id = sharedA;
    sharedA += 1;
};

reflectAllowed = function() {
    return (turn >= REFLECT_ALLOWED_FROM_TURN);
}

/******************************************************************** Dodging ********************************************************************/

scoreDodgeLocation = function(cx, cy) {
    if ((cx != x || cy != y) && !canMoveTo(cx, cy)) return -99999999;

    s = 0;

    // Prefer dist >= 5 from enemies
    dc = distToClosestEnemyBot(cx, cy);
    if (dc == 4) s -= 2;
    if (dc == 3) s -= 3;
    if (dc == 2) s -= 4;
    if (dc == 1) s -= 10;

    // Avoid moving next to friendly bots
    s -= 1*friendlyBotsWithinDist(cx, cy);

    // Use heatMap to score the potential of taking damage in location
    s -= 0.05*getLocationHeat(cx, cy);

    // TODO avoid laser cardinality if we don't have lasers

    return s;
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
    if (reflectAllowed() && canReflect()) return 1;
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

    //debugLog('T' + turn + 'u(' + scoreUp + ') d(' + scoreDown + ') l(' + scoreLeft + ') r(' + scoreRight + ') c(' + scoreCurrent + ')');

    // Choose best score, break ties with a directional preference: vertical > left > right
    scoreBest = max(scoreCurrent, scoreUp, scoreDown, scoreLeft, scoreUp);
    if (scoreUp == scoreBest) move('up');
    if (scoreDown == scoreBest) move('down');
    if (scoreLeft == scoreBest) move('left');
    if (scoreRight == scoreBest) move('right');
    // when scoreCurrent is best we fall through
}

/******************************************************************** Main AI ********************************************************************/

maybeFireAtTarget = function(target) {
    if (!exists(target)) return;
    if (willArtilleryHit(target)) fireArtillery(target);
    if (willLasersHit(target)) fireLasers(target);
    if (willMissilesHit(target)) fireMissiles(target);
}

maybeFireAtLowestHealthBot = function() {
    targets = findEntities(ENEMY, BOT, false);
    lowestHealthBot = filterEntities(targets, [SORT_BY_LIFE], [SORT_ASCENDING]);
    maybeFireAtTarget(target);
}

maybeFireAtClosestBot = function() {
    targets = findEntities(ENEMY, BOT, false);
    target = filterEntities(targets, [SORT_BY_DISTANCE], [SORT_ASCENDING]);
    maybeFireAtTarget(target);
}

maybeFireAtAnyBot = function() {
    array1 = findEntities(ENEMY, BOT, false);
    for (i = 0; i < size(array1); i++) {
        maybeFireAtTarget(array1[i]);
    }
}

maybeFireAtAnything = function() {
    if (willArtilleryHit()) fireArtillery();
    if (willLasersHit()) fireLasers();
    if (willMissilesHit()) fireMissiles();
}

maybeFire = function() {
    maybeFireAtLowestHealthBot();
    maybeFireAtClosestBot();
    maybeFireAtAnyBot();
    maybeFireAtAnything();
}

reactToEnclosingEnemies = function() {
    closestEnemy = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (!exists(closestEnemy)) return;
    // try to retreat
    if (x <= getX(closestEnemy)) moveIfSafe(x-1, y);
    if (y <= getY(closestEnemy)) moveIfSafe(x, y-1);
    if (y > getY(closestEnemy)) moveIfSafe(x, y+1);
    if (x > getX(closestEnemy)) moveIfSafe(x+1, y);
    // if retreat is not possible, fight to the death
    if (willMeleeHit(closestEnemy)) {
        melee(closestEnemy);
    }
    pursue(closestEnemy);
}

moveIfSafe = function(cx, cy) {
    if (!canMoveTo(cx, cy)) return;
    if (isLocationHot(cx, cy)) return;
    moveTo(cx, cy);
}

maybeMoveTowardsCPU = function() {
    // Move vertically towards center before moving horizontally towards right.
    if (y < (arenaHeight/2 - 4)) {
        moveIfSafe(x, y+1);
    } else if (y > (arenaHeight/2 + 3)) {
        moveIfSafe(x, y-1);
    }
    moveIfSafe(x+1, y);
}

startSpecials = function() {
    if (life < 2000 || currDistToClosestBot <= 5) DESTROY_CHIPS_AT_START = false;
    if (DESTROY_CHIPS_AT_START) {
        chip = findEntity(ENEMY, CHIP, SORT_BY_DISTANCE, SORT_ASCENDING);
        if (exists(chip) && willArtilleryHit(chip)) fireArtillery(chip);
        else DESTROY_CHIPS_AT_START = false;
    }
}

act = function() {
    if (currDistToClosestBot >= 2) {
        if (isLocationHot(x, y)) {
            probablyDodge();
        } else if (currDistToClosestBot <= 4 && !willMissilesHit(findClosestEnemyBot())) {
            probablyDodge();
        }
    }
    if (reflectAllowed() && canReflect() && currDistToClosestBot <= 5) {
        reflect();
    }
    if (canActivateSensors() && currDistToClosestBot > 5 && prevDistToClosestBot <= 5) {
        activateSensors();
    }

    maybeFire();
    reactToEnclosingEnemies();
    maybeMoveTowardsCPU();
    //TODO fallback?
}

update = function() {


    // Maintain state
    turn += 1;
    prevLife = currLife;
    currLife = life;
    prevDistToClosestBot = currDistToClosestBot;
    currDistToClosestBot = distToClosestEnemyBot(x, y);
    updateHeatmap();



    //debugLog('turn', turn, 'x', x, 'y', y, 'life', life, 'heat', getLocationHeat(x, y));

    // Start specials
    startSpecials();

    // Actions
    act();

};







