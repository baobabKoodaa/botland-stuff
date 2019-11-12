n = function(msg) {
    // Flag a bug with taunt crying emoji.
    debugLog('ERROR turn', turn, "at", x, y, "msg", msg)
    taunt('CRYING')
}

wait = function() {
    taunt('THUMBS_UP')
}

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
    return (!outOfBounds(cx, cy) && canTeleport(cx, cy) && !getEntityAt(cx, cy))
}

tryTeleport = function(cx, cy) {
    if (canActuallyTeleport(cx, cy)) {
        lastMoveTurn = turn
        lastTeleportTurn = turn
        teleport(cx, cy)
    }
}

triggerCoordinatedTeleport = function() {
    sharedC = turn
}

tryMelee = function(cx, cy) {
    e = getEntityAt(cx, cy)
    if (!exists(e)) return
    if (willMeleeHit(e)) melee(e)
}

coordinatedTeleportTriggered = function() {
    if (sharedC == turn) return true
    if (sharedC == turn-1) return true // sometimes we act just before a teammate coordinates teleport, so we jump next turn
    return false
}

m = function(cx, cy) {
    if (canMoveTo(cx, cy)) {
        lastMoveTurn = turn
        moveTo(cx, cy)
    }
}

tryToRepairSomeoneWithoutMoving = function() {
    if (willRepair()) {
        if (life < 1900) repair()
        repairIfNeeded(x+1, y)
        repairIfNeeded(x-1, y)
        repairIfNeeded(x, y+1)
        repairIfNeeded(x, y-1)
    }
}

repairIfNeeded = function(cx, cy) {
    repairTarget = getEntityAt(cx, cy)
    if (!exists(repairTarget)) return
    if (getLife(repairTarget) < 1900) repair(repairTarget)
    // TODO make sure it's a friendly
}

inMeleeOrEnemyEnclosing = function() {
    if (currDistToClosestBot <= 1) return true;
    if (currDistToClosestBot <= 2 && currDistToClosestBot < prevDistToClosestBot) return true;
    return false;
}

// Returns number of enemy bots between minDist, maxDist (inclusive, both) (that we can sense).
countEnemyBotsWithinDist = function(cx, cy, minDist, maxDist) {
    c = 0
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        dx = abs(ex - cx)
        dy = abs(ey - cy)
        if (dx+dy >= minDist && dx+dy <= maxDist) c += 1
    }
    return c;
}

distToClosestEnemyBot = function(cx, cy) {
    lowestDist = 999
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        dx = abs(ex - cx)
        dy = abs(ey - cy)
        if (dx+dy < lowestDist) lowestDist = dx+dy
    }
    return lowestDist
}

friendlyBotsWithinDist = function(cx, cy, minDist, maxDist) {
    c = 0
    array1 = findEntities(IS_OWNED_BY_ME, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        dx = abs(ex - cx)
        dy = abs(ey - cy)
        if (dx+dy >= minDist && dx+dy <= maxDist) c += 1
    }
    return c;
}

/*************************************** Melee cardinality *****************************************/

moveIfNoMeleeCardinality = function(cx, cy) {
    if (canMoveTo(cx, cy) && countEnemyBotsWithMeleeCardinality(cx, cy) == 0) moveTo(cx, cy)
}

countEnemyBotsWithMeleeCardinality = function(cx, cy) {
    c = 0
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        if (hasMeleeCardinality(cx, cy, ex, ey)) c += 1
    }
    return c
}

hasMeleeCardinality = function(cx, cy, ex, ey) {
    dx = abs(ex - cx)
    dy = abs(ey - cy)
    if (dx+dy == 1) {
        // Dist 1.
        return true
    } else if (dx+dy == 2 && dx!=dy) {
        // Charging is possible by range and cardinality. Next we check if charging path is blocked.
        if (ex == cx-2 && !getEntityAt(cx-1, cy)) return true // TODO chips are considered to be blocking. fix that.
        else if (ex == cx+2 && !getEntityAt(cx+1, cy)) return true
        else if (ey == cy-2 && !getEntityAt(cx, cy-1)) return true
        else if (ey == cy+2 && !getEntityAt(cx, cy+1)) return true
        // Handling for special case where it looks like _we_ would be blocking the charging path.
        // If we are considering a move to cx,cy, then we will _not_ be actually blocking the charging path.
        else if (ex == cx-2 && x == cx-1) return true
        else if (ex == cx+2 && x == cx+1) return true
        else if (ey == cy-2 && y == cy-1) return true
        else if (ey == cy+2 && y == cy+1) return true
    }
    return false
}





// Returns 1 if we can fire lasers at any enemy bot from given coordinates.
/*
canFireLasers = function(cx, cy) {
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        dx = abs(ex - cx)
        dy = abs(ey - cy)
        if (dx+dy <= 5) {
            if (ex == cx) return 1
            if (ey == cy) return 1
        }
    }
    return 0
}
*/














