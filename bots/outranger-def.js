init = function() {
    DODGE_ARTILLERY = 1
    REFLECT_ALLOWED_FROM_TURN = 1


    DODGE_COOLDOWN = 3;
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
}

update = function() {
    commonStateUpdates()
    updateHeatmap()

    //debugLog('turn', turn, 'x', x, 'y', y, 'life', life, 'heat', getLocationHeat(x, y));

    specialActions()
    normalActions()

}

specialActions = function() {

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
    maybeFire()
    if (canShield()) shield()
    if (canActivateSensors()) {
        activateSensors()
    }
    if (canLayMine()) layMine()
    maybeMoveTowardsStartLocation()
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

maybeMoveTowardsStartLocation = function() {
    if (x < startX) moveIfSafe(x+1, y)
    if (x > startX) moveIfSafe(x-1, y)
    if (y < startY) moveIfSafe(x, y+1)
    if (y > startY) moveIfSafe(x, y-1)
}









