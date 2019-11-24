//!import state
//!import utils

init = function() {
    commonInitProcedures()

    ROW_FIRST_REFLECT_ON_ENEMY_SIGHT = 1
    ON_DMG_REFLECT = 1
    DODGE_ARTILLERY = 0 // simple dodge, not heatmap
    REPAIR_AVAILABLE = 1
    ALLOW_MOVE_TURN = 1


    // Roles
    ROLE_STUNNA = 0
    ROLE_REPAIR = 1
    ROLE_BACK_ROW = 2
    role = ROLE_BACK_ROW

    lastLureTurn = -666
    lastDodgeTurn = 0
    lastLaserTurn = -666
    lastSawEnemyTurn = 0

    // Reserved shared vars:
    // sharedD = row's current Y
    // sharedE = goal coordinates
}

update = function() {
    commonStateUpdates()
    rowFirstUpdates()

    if (turn == 1) {
        detectRole()
    }

    maybeLure()
    maybeDodge()
    tryShieldRightMostFriendly()
    maybeReflect()
    maybeFire()
    maybeMoveTowardsGoal()
    maybeRepair()

    if (canActivateSensors()) activateSensors()

    idleJobs()
}

idleJobs = function() {
    if (willLasersHit()) fireLasers()
    if (willArtilleryHit()) fireArtillery()

    // Cloaked enemies may be there. Why not.
    if (randInt(0, 2) == 0) fireLasers('up')
    else fireLasers('down')
}

rowFirstUpdates = function() {
    if (iAmRightMostFriendly()) {
        setRowY(y)
        maybeUpdateGoal()
    }
}

setRowY = function(cy) {
    sharedD = cy
}

getRowY = function() {
    return sharedD
}

maybeUpdateGoal = function() {
    if (turn == 1 || turn < ALLOW_MOVE_TURN) {
        setGoal(startX, startY)
    } else if (currDistToClosestBot <= 7) {
        nmy = findClosestEnemyBot()
        // Prefer enemies within row's firing range rather than enemies which are closer but not on firing range.
        if (eat(x+1, y)) nmy = getEntityAt(x+1, y)
        if (eat(x+2, y)) nmy = getEntityAt(x+2, y)
        if (eat(x+3, y)) nmy = getEntityAt(x+3, y)
        ex = getX(nmy)
        ey = getY(nmy)
        setGoal(getX(nmy), getY(nmy))
    } else if (!REPAIR_AVAILABLE || life >= 1900 || role == ROLE_BACK_ROW) { // this is hacky, but role==back row in this case is a check if repairman is dead
        if (x < xCPU-1) setGoal(xCPU-1, y)
        else setGoal(x, yCPU)
    } else {
        // We have a need to repair and we think repairing is possible. TODO: prevent being jammed here
        setGoal(x, y)
    }
}

setGoal = function(cx, cy) {
    sharedE = 100*cx + cy
}

goalX = function() {
    return floor(sharedE / 100)
}

goalY = function() {
    return sharedE % 100
}

detectRole = function() {
    if (iAmRightMostFriendly()) role = ROLE_STUNNA
    else if (willRepair()) role = ROLE_REPAIR
    else role = ROLE_BACK_ROW
}








maybeLure = function() {
    // Stay alive and possibly lure nearby enemies into line of fire.
    if (currDistToClosestBot == 1) {
        nmy = findClosestEnemyBot()
        ey = getY(nmy)
        dy = abs(y - ey)
        if (dy == 1 && lastLureTurn < turn-3) { // TODO what about when the frontliner lures and then changes rowY???
            // Enemy is just below or above our row, try to lure it into line of fire.
            lastLureTurn = turn
            if (y < ey) m(x, y-1)
            if (y > ey) m(x, y+1)
        }
        if (dy == 1 && lastLureTurn == turn-1) {
            // We just lured enemy.
            // TODO: ???
        }
    }
}

maybeDodge = function() {
    if (DODGE_ARTILLERY) {
        if (lastDodgeTurn <= turn-3) {
            lastDodgeTurn = turn
            if (y < goalY()) m(x, y+1)
            m(x, y-1)
        }
    }
}

maybeFire = function() {
    //TODO targeting (prefer an enemy bot on our right, then enemy bot anywhere else, then chips/cpus)
    if (willLasersHit()) { // TODO willLasersHitAnyBot (not chip)
        lastLaserTurn = turn
        fireLasers()
    }
    if (willArtilleryHit()) {
        tryArtillery(x+5, y)
        tryArtillery(x+6, y)
        tryArtillery(x+7, y)
        //fireArtillery() // This is commented out because the strength of this strategy relies on moving as a row, firing lasers as a row, and we don't want to stay behind shooting arty. We only need arty for our back row in laser vs laser battles.
    }
}

tryArtillery = function(cx, cy) {
    artyTarget = getEntityAt(cx, cy)
    if (exists(artyTarget) && willArtilleryHit(artyTarget)) fireArtillery(artyTarget)
}

maybeMoveTowardsGoal = function() {
    if (!DODGE_ARTILLERY && lastDodgeTurn <= turn-3) {
        // Prefer move in y-direction, but prevent move towards y-goal if it interferes with artillery dodging (we dont want to whipsaw back into a tile that we just dodged from)
        if (y < goalY()) m(x, y+1)
        if (y > goalY()) m(x, y-1)
    }
    if (x < goalX()) m(x+1, y)
}

maybeReflect = function() {
    if (canReflect() && currDistToClosestBot <= 5) {
        if (ON_DMG_REFLECT && dmgTaken > 100 && currDistToClosestBot > 1) reflect()
        if (ROW_FIRST_REFLECT_ON_ENEMY_SIGHT && iAmRightMostFriendly()) {
            if (role == ROLE_STUNNA && currDistToClosestBot == 1 && lastLaserTurn < turn-1) {
                // Special case where we prefer stun laser instead of reflecting.
                return
            }
            reflect()
        }
    }
}

maybeRepair = function() {
    if (willRepair()) {
        repairIfNeeded(x+1, y)
        if (life < 1900) repair()
        repairIfNeeded(x-1, y)
    }
}