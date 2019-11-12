//!import state
//!import utils

init = function() {

    KILL_REPAIRERS = 0
    ALTERNATE_REFLECT_CLOAK = 1
    DODGE_ARTILLERY = 0

    // These are needed for dodge position preference
    firstXwhereWeShootCPU = null
    firstYwhereWeShootCPU = null

    commonInitProcedures()
    initGoalToNothing()
}

update = function() {

    commonStateUpdates()

    //startSpecialMoveThreeCloakMoveThreeTele()
    //startSpecialCloakMoveThreeTele()
    //startSpecialReflectTele()
    //startSpecialCloakTele()
    //startSpecialCloakTeleReflect()
    //startSpecialTeleCloak()
    startSpecialSlowRush(8)
    //startSpecialCloakMoveToGoal()
    //startSpecialCraiton()

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
                m(goalX, goalY)
                // Fallback (tile is probably occupied)
                initGoalToNothing()
                setNewGoal()
                m(goalX, goalY)
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
            if (x < ex) m(x+1, y)
            if (y < ey) m(x, y+1)
            if (y > ey) m(x, y-1)
            if (x < ex+1) m(x+1, y) // Right edge of map is a good place to be.
            if (x > ex) m(x-1, y)
        } else if (dx+dy < 5) {
            // Need to move further
            if (x > ex) m(x+1, y)
            if (y > ey) m(x, y+1)
            if (y < ey) m(x, y-1)
        } else {
            n()
        }
    }

    if (!firstXwhereWeShootCPU && getX(target) == xCPU && getY(target) == yCPU) {
        firstXwhereWeShootCPU = x
        firstYwhereWeShootCPU = y
    }
    fireArtillery(target)
}

startSpecialSlowRush = function(cloakTurn) {
    if (turn == cloakTurn && canCloak() && !isCloaked()) {
        cloak()
    }
    if (turn <= cloakTurn+3) m(x+1, y)
    if (turn == cloakTurn+4) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

startSpecialCraiton = function() {
    if (x < 6) {
        if (!areSensorsActivated()) {
            if (canActivateSensors()) {
                if (canShield()) shield()
                activateSensors()
            }
            wait()
        }
        if (areSensorsActivated()) m(x+1, y)
    }
    if (x == 6) {
        cpu = getEntityAt(xCPU, yCPU)
        if (exists(cpu) && willArtilleryHit(cpu)) fireArtillery(cpu)
        m(x-1, y)
    }

    n()
}

setNewGoal = function() {
    // Prefer
    if (firstXwhereWeShootCPU && (x != firstXwhereWeShootCPU || y != firstYwhereWeShootCPU)) {
        tryToSetGoal(firstXwhereWeShootCPU, firstYwhereWeShootCPU)
    }
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
    if (turn == 2) m(x+1, y)
    if (turn == 3) m(x+1, y)
    if (turn == 4) m(x+1, y)
    if (turn == 5) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

startSpecialMoveThreeCloakMoveThreeTele = function() {
    if (turn == 1) m(x+1, y)
    if (turn == 2) m(x+1, y)
    if (turn == 3) m(x+1, y)
    if (turn == 4) cloak()
    if (turn == 5) m(x+1, y)
    if (turn == 6) m(x+1, y)
    if (turn == 7) m(x+1, y)
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

startSpecialCloakTele = function() {
    if (turn == 1 && canCloak()) cloak()
    if (turn <= 2) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

startSpecialCloakTeleReflect = function() {
    startSpecialCloakTele()
    if (turn <= 3 && canReflect()) reflect()
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

startSpecialCloakMoveToGoal = function() {
    if (turn == 1 && canCloak()) cloak()
    if (turn == 2) {
        tryToSetGoal(xCPU, yCPU-5)
        tryToSetGoal(xCPU, yCPU+5)
    }
}

getArtyTarget = function() {
    if (KILL_REPAIRERS) {
        // First prefer repairers that we can hit
        option = getEntityAt(xCPU-1, yCPU)
        if (exists(option) && willArtilleryHit(option)) return option
        option = getEntityAt(xCPU, yCPU-1)
        if (exists(option) && willArtilleryHit(option)) return option
        option = getEntityAt(xCPU, yCPU+1)
        if (exists(option) && willArtilleryHit(option)) return option
        option = getEntityAt(xCPU+1, yCPU)
        if (exists(option) && willArtilleryHit(option)) return option
        // Any repairer will do
        option = getEntityAt(xCPU-1, yCPU)
        if (exists(option)) return option
        option = getEntityAt(xCPU, yCPU-1)
        if (exists(option)) return option
        option = getEntityAt(xCPU, yCPU+1)
        if (exists(option)) return option
        option = getEntityAt(xCPU+1, yCPU)
        if (exists(option)) return option
    }
    cpu = getEntityAt(xCPU, yCPU)
    if (exists(cpu)) return cpu
    return null
}

