/** n, as in "this should Never execute".
 *  Used to flag bugs with taunt crying emoji. */
n = function(msg) {
    debugLog('ERROR turn', turn, "at", x, y, "msg", msg)
    taunt('CRYING')
}

/** w, as in "wait". */
w = function() {
    taunt('THUMBS_UP')
}

/** d, as in "distance". */
d = function(ax, ay, bx, by) {
    dx = abs(ax - bx)
    dy = abs(ay - by)
    return dx+dy
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

findLeftMostEnemyBot = function() {
    leftMostNmyBot = null
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        if (leftMostNmyBot == null || getX(array1[i]) < getX(leftMostNmyBot)) {
            leftMostNmyBot = array1[i]
        }
    }
    return leftMostNmyBot
}

t = function(cx, cy) {
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

meleeAnythingButDontCharge = function() {
    range1targets = findEntitiesInRange(ENEMY, ANYTHING, false, 1)
    anyTarget = filterEntities(range1targets, [SORT_BY_LIFE], [SORT_ASCENDING])
    if (exists(anyTarget)) melee(anyTarget)
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

eat = function(cx, cy) {
    return (exists(getEntityAt(cx, cy)))
}

tryShield = function(cx, cy) {
    shieldTarget = getEntityAt(cx, cy)
    if (exists(shieldTarget) && canShield(shieldTarget)) shield(shieldTarget)
}

iAmRightMostFriendly = function() {
    array1 = findEntities(IS_OWNED_BY_ME, BOT, false)
    for (i = 0; i < size(array1); i++) {
        if (getX(array1[i]) > x) {
            return false
        }
    }
    return true
}

// Reminder: do not merge these functions together; we need the canShield check separately for each unit.
tryShieldRightMostFriendly = function() {
    array1 = findEntities(IS_OWNED_BY_ME, BOT, true)
    rightMost = array1[0]
    for (i = 1; i < size(array1); i++) {
        if (getX(array1[i]) > getX(rightMost) && canShield(array1[i])) {
            rightMost = array1[i]
        }
    }
    if (canShield(rightMost)) shield(rightMost)
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
        dist = d(cx, cy, ex, ey)
        if (dist >= minDist && dist <= maxDist) c += 1
    }
    return c;
}

distToClosestEnemyBot = function(cx, cy) {
    lowestDist = 999
    array1 = findEntities(ENEMY, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        dist = d(cx, cy, ex, ey)
        if (dist < lowestDist) lowestDist = dist
    }
    return lowestDist
}

friendlyBotsWithinDist = function(cx, cy, minDist, maxDist) {
    c = 0
    array1 = findEntities(IS_OWNED_BY_ME, BOT, false)
    for (i = 0; i < size(array1); i++) {
        ex = getX(array1[i])
        ey = getY(array1[i])
        dist = d(cx, cy, ex, ey)
        if (dist >= minDist && dist <= maxDist) c += 1
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
    dist = d(cx, cy, ex, ey)
    if (dist == 1) {
        // Dist 1.
        return true
    } else if (dist == 2 && dist) {
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













