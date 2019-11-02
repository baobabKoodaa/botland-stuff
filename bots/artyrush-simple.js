//!import state
//!import utils

init = function() {
    commonInitProcedures()

    KILL_REPAIRERS = 0
}

update = function() {

    commonStateUpdates()

    //startSpecialMoveThreeCloakMoveThreeTele()
    startSpecialCloakMoveThreeTele()
    //startSpecialReflectTele()


    if (canCloak() && !isReflecting() && !isCloaked()) cloak()

    target = getArtyTarget()
    if (exists(target)) {
        fireArtillery(target)
    }

    // If we can't fire at CPU let's try to get closer to it.
    if (x < xCPU) tryMoveTo(x+1, y)
    if (y < yCPU) tryMoveTo(x, y+1)
    if (y > yCPU) tryMoveTo(x, y-1)
    if (x < xCPU+1) tryMoveTo(x+1, y)
};

startSpecialCloakMoveThreeTele = function() {
    if (turn == 1) cloak()
    if (turn == 2) moveTo(x+1, y)
    if (turn == 3) moveTo(x+1, y)
    if (turn == 4) moveTo(x+1, y)
    if (turn == 5) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+3, y-2)
    }
}

startSpecialMoveThreeCloakMoveThreeTele = function() {
    if (turn == 1) moveTo(x+1, y)
    if (turn == 2) moveTo(x+1, y)
    if (turn == 3) moveTo(x+1, y)
    if (turn == 4) cloak()
    if (turn == 5) moveTo(x+1, y)
    if (turn == 6) moveTo(x+1, y)
    if (turn == 7) moveTo(x+1, y)
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

getArtyTarget = function() {
    if (KILL_REPAIRERS) {
        option = getEntityAt(xCPU-1, yCPU)
        if (exists(option) && willArtilleryHit(option)) return option
        //option = getEntityAt(xCPU, yCPU-1)
        //if (exists(option) && willArtilleryHit(option)) return option
        //option = getEntityAt(xCPU, yCPU+1)
        //if (exists(option) && willArtilleryHit(option)) return option
    }
    cpu = getEntityAt(xCPU, yCPU)
    if (willArtilleryHit(cpu)) return cpu
    return null
}

