//!import state
//!import utils

init = function() {

    KILL_REPAIRERS = 0
    ALTERNATE_REFLECT_CLOAK = 1
    DODGE_ARTILLERY = 0

    commonInitProcedures()
    initGoalToNothing()
}

update = function() {

    commonStateUpdates()

    //startSpecialMoveThreeCloakMoveThreeTele()
    //startSpecialCloakMoveThreeTele()
    startSpecialReflectTele()
    //startSpecialTeleCloak()
    //startSpecialSlowRush()

    // Set target ex,ey.
    ex = xCPU
    ey = yCPU
    target = getArtyTarget()
    if (exists(target)) {
        // Sometimes target can also be a repairer.
        ex = getX(target)
        ey = getY(target)
    }

    if (DODGE_ARTILLERY) {
        if (x == goalX && y == goalY) {
            // Clear out goal when we reach it.
            initGoalToNothing()
        }
        if (turn >= lastMoveTurn+3) {
            // Set goalX, goalY as a _different_ tile that is 5 tiles from target. Prefer edge of map.
            setNewGoal()
        }
        if (goalX > 0) {
            // A movement goal has been set. Move towards the goal until we hit it.
            if (x != goalX || y != goalY) {
                tryMoveTo(goalX, goalY)
                // Fallback (tile is probably occupied)
                initGoalToNothing()
                setNewGoal()
                tryMoveTo(goalX, goalY)
            }
        }
    }

    if (ALTERNATE_REFLECT_CLOAK) {
        // Preference on reflecting
        if (canReflect() && !isReflecting() && !isCloaked()) reflect()
        if (canCloak() && !isReflecting() && !isCloaked()) cloak()
    }

    if (!exists(target) || !willArtilleryHit(target)) {
        // If we can't fire at target let's try to get to 5 distance of it
        dx = abs(x - ex)
        dy = abs(y - ey)
        if (dx+dy > 5) {
            // Need to move closer.
            if (x < ex) tryMoveTo(x+1, y)
            if (y < ey) tryMoveTo(x, y+1)
            if (y > ey) tryMoveTo(x, y-1)
            if (x < ex+1) tryMoveTo(x+1, y) // Right edge of map is a good place to be.
        } else if (dx+dy < 5) {
            // Need to move further
            if (x > ex) tryMoveTo(x+1, y)
            if (y > ey) tryMoveTo(x, y+1)
            if (y < ey) tryMoveTo(x, y-1)
        } else {
            thisShouldNeverExecute()
        }
    }

    fireArtillery(target)
}

startSpecialSlowRush = function() {
    cloakTurn = 5
    if (turn == cloakTurn && canCloak() && !isCloaked()) {
        cloak()
    }
    if (turn <= cloakTurn+3) tryMoveTo(x+1, y)
    if (turn == cloakTurn+4) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

setNewGoal = function() {
    // Normal goals at 2dist
    tryToSetGoal(x+2, y)
    tryToSetGoal(x+1, y+1)
    tryToSetGoal(x+1, y-1)
    tryToSetGoal(x-1, y+1)
    tryToSetGoal(x-1, y-1)
    tryToSetGoal(x-2, y)
    // Fallback goals at 1dist (if our goal was blocked and we have to set a new goal en route)
    tryToSetGoal(x+1, y)
    tryToSetGoal(x, y+1)
    tryToSetGoal(x, y-1)
    tryToSetGoal(x-1, y)

    debugLog("turn", turn, "x", x, "y", y, "goalX", goalX, "goalY", goalY)
}

initGoalToNothing = function() {
    goalX = -1
    goalY = -1
}

tryToSetGoal = function(cx, cy) {
    if (goalX > 0) return // A goal has already been set.
    if (outOfBounds(cx, cy)) return
    dx = abs(cx - ex)
    dy = abs(cy - ey)
    if (dx+dy == 5) {
        goalX = cx
        goalY = cy
    }
}

startSpecialCloakMoveThreeTele = function() {
    if (turn == 1) cloak()
    if (turn == 2) tryMoveTo(x+1, y)
    if (turn == 3) tryMoveTo(x+1, y)
    if (turn == 4) tryMoveTo(x+1, y)
    if (turn == 5) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

startSpecialMoveThreeCloakMoveThreeTele = function() {
    if (turn == 1) tryMoveTo(x+1, y)
    if (turn == 2) tryMoveTo(x+1, y)
    if (turn == 3) tryMoveTo(x+1, y)
    if (turn == 4) cloak()
    if (turn == 5) tryMoveTo(x+1, y)
    if (turn == 6) tryMoveTo(x+1, y)
    if (turn == 7) tryMoveTo(x+1, y)
    if (turn == 8) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

startSpecialReflectTele = function() {
    if (turn == 1 && canReflect()) reflect()
    if (turn <= 2) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

startSpecialTeleCloak = function() {
    if (turn == 1) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
    if (turn == 2 && canCloak()) cloak()
}

getArtyTarget = function() {
    if (KILL_REPAIRERS) {
        option = getEntityAt(xCPU-1, yCPU)
        if (exists(option) && willArtilleryHit(option)) return option
        option = getEntityAt(xCPU, yCPU-1)
        if (exists(option) && willArtilleryHit(option)) return option
        option = getEntityAt(xCPU, yCPU+1)
        if (exists(option) && willArtilleryHit(option)) return option
    }
    cpu = getEntityAt(xCPU, yCPU)
    if (exists(cpu) && willArtilleryHit(cpu)) return cpu
    return null
}

