init = function() {
    DODGE_ARTILLERY = 1
    REFLECT_ALLOWED_FROM_TURN = 1
    DESTROY_CHIPS_AT_START = 1


    DODGE_COOLDOWN = 2;
    DODGE_PENALTY_DIST_7 = 0
    DODGE_PENALTY_DIST_6 = 0
    DODGE_PENALTY_DIST_5 = 0
    DODGE_PENALTY_DIST_4 = 2
    DODGE_PENALTY_DIST_3 = 3
    DODGE_PENALTY_DIST_2 = 4
    DODGE_PENALTY_DIST_1 = 10
    DODGE_PENALTY_DIST_5_CARDINALITY_EXTRA = 0
    DODGE_PENALTY_DIST_4_CARDINALITY_EXTRA = 2
    DODGE_PENALTY_DIST_3_CARDINALITY_EXTRA = 3
    DODGE_PENALTY_DIST_2_CARDINALITY_EXTRA = 4
    DODGE_PENALTY_EDGE_OF_MAP = 1

    commonInitProcedures()
    initializeHeatmap()
}

update = function() {
    commonStateUpdates()
    updateHeatmap()

    //debugLog('turn', turn, 'x', x, 'y', y, 'life', life, 'heat', getLocationHeat(x, y));

    specialActions()
    normalActions()

}

specialActions = function() {
    if (life < 2000 || currDistToClosestBot <= 5) DESTROY_CHIPS_AT_START = false
    if (DESTROY_CHIPS_AT_START) {
        chip = findEntity(ENEMY, CHIP, SORT_BY_DISTANCE, SORT_ASCENDING)
        if (exists(chip) && willArtilleryHit(chip)) fireArtillery(chip)
        else DESTROY_CHIPS_AT_START = false
    }
}

normalActions = function() {
    if (isLocationHot(x, y) || (currDistToClosestBot <= 4 && !willMissilesHit(findClosestEnemyBot()))) {
        if (turn >= lastDodgeTurn+DODGE_COOLDOWN) {
            lastDodgeTurn = turn
            probablyDodge()
        }
    }
    if (reflectAllowed() && currDistToClosestBot <= 5) {
        reflect()
    }
    if (canActivateSensors() && currDistToClosestBot > 5 && prevDistToClosestBot <= 5) {
        activateSensors()
    }

    maybeFire()
    maybeMoveTowardsCPU()
    //TODO fallback?
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

moveIfSafe = function(cx, cy) {
    if (isLocationHot(cx, cy)) return;
    tryMoveTo(cx, cy);
}

maybeMoveTowardsCPU = function() {
    moveIfSafe(x+1, y)
    if (y < (arenaHeight/2 - 4)) {
        moveIfSafe(x, y+1);
    } else if (y > (arenaHeight/2 + 3)) {
        moveIfSafe(x, y-1);
    }
}









