//!import state
//!import utils
//!import tracking

init = function() {

    commonInitProcedures()
    initializeTracking()
}

update = function() {



    commonStateUpdates()

    if (turn >= 4) return

    array2 = sharedB

    // Tracking updates
    updateEnemyLocations()
    if (turn == 1) {
        // TODO: if total number of known enemies is < 3, assume that some bots are lurking in corners
    }

    // TODO if CPU rush detected move to scramble mode (goalpost at either JUST ABOVE CPU or JUST BELOW CPU or in some case BOTH)
    // (shield CPU)
    act()

}

act = function() {

    if (turn == 1) {
        findOutMyRole()
    }
    if (role == 'M') actM()
    if (role == 'R') actR()
    if (role == 'E') actE()
}

actM = function() {
    if (turn == 1) {
        preventImmediateDeath()
        tryToShieldSomeone()
    }
}

actR = function() {
    // TODO shield requestien pitäis lähteä vasta ennen terminaattoria! jos ukko movee, teleporttaa tai chargee ni pitäis kirjata requestiin oletettu tuleva sijainti! samasta syystä myös muiden terminaattorien yhteydessä pitäis lähettää shield req
    askForShield(currDistToClosestBot, turn, x, y)
    if (turn == 1) {
        if (x >= 7) {
            // Anti-CPU rush
            tryMelee(x+2, y) // More important than immediate zapping!
            if (countEnemyBotsWithinDist(x, y, 1, 2) >= 2) {
                // Zap is better than melee.
                if (canZap()) zap()
            }
            tryMelee(x, y-2)
            tryMelee(x, y+2)
            tryMelee(x+1, y)
            tryMelee(x, y-1)
            tryMelee(x, y+1)
            preventImmediateDeath() // Note that we don't have to prevent immediate death for other units on turn 1 because they are within EMP protection range.
        }
        // TODO if 3 enemies are in the middle, ALL R's should jump in & fight immediately.
        // TODO if 1-2 enemies are in the middle, the left-most R and the 2 closest R's should jump in & fight immediately. Other R's should defend CPU

        // Typical case: reflect/shield
        if (canReflect()) reflect()
        if (canShield()) tryToShieldSomeone()

        // Fallback which happens only if cooldowns carry-over from previous round.
        fallbackToSomethingUseful()
    }
    if (turn == 2) {
        // TODO decloak enemies: if enemy was next to us on last turn, but has now disappeared, move into the square which was occupied by the enemy.

        // Typical case
        if (canZap()) zap()

        // Fallback which happens if enemy EMP'd our zap or if cooldowns carry-over from previous round.
        fallbackToSomethingUseful()
    }
    if (turn == 3) {
        // TODO Offensive teleport or defensive teleport (in case of CPU rush)
        // Remember to use shared knowledge of enemy positions when choosing teleport target.
    }

}

fallbackToSomethingUseful = function() {
    if (willMeleeHit()) melee()
    if (canReflect()) reflect()
    if (canShield()) tryToShieldSomeone()
    wait() // TODO something choose when to pursue enemies or go to CPU.
}

actE = function() {
    countEnemiesInEmpRadius = countEnemyBotsWithinDist(x, y, 1, 5)
    if (turn == 1) {
        if (countEnemiesInEmpRadius >= 2 && canEmp()) {
            // The most likely reason for having so many enemies close to the center at turn 1 is that they intend to zap.
            emp("ZAPPER")
        }
        // TODO if 3 enemies are in the middle, EMP(TELEPORT) immediately (all units will teleport immediately to fight them)
        // TODO if a single enemy is in the middle, EMP(EMP) to prevent the enemy from using EMP to prevent our units from teleporting
        tryToShieldSomeone()
    }
    if (turn == 2) {
        // We may have emped potential zappers on turn 1. If we have action in the middle, let's make room for teleporting melee allies.
        preventImmediateDeath()


        // TODO teleport towards action

    }
    if (turn == 3) {
        // TODO emp (or maybe just normal routine, where emp-when-friendlies-melee is part of normal routine?)
    }
    // TODO emp melee on left side bunches, emp teleport on right side bunches
}

// TODO escape-teleporting when in danger at any point!

tryToShieldSomeone = function() {
    if (!canShield()) return
    enc = pollPrioritizedShieldWithinRange()
    if (enc > 0) {
        // Shield and put the shield request back in array2 with incremented priority.
        sp = decodePriority(enc)
        st = decodeTurn(enc)
        sx = decodeX(enc)
        sy = decodeY(enc)
        newPriority = max(5, sp+1)
        askForShield(newPriority, st, sx, sy)
        shieldEntity = getEntityAt(sx, sy)
        if (exists(shieldEntity) && canShield(shieldEntity)) shield(shieldEntity)
    }
    // Fallback if no R-unit has requested shield, all requesting units are out of range, or possible other failures.
    shield()
}

findOutMyRole = function() {
    if (canZap()) role = 'R' // Zap-melee-teleporter (with reflect/shield)
    else if (canEmp()) role = 'E' // Emp-shield-teleporter
    else role = 'M' // Missile-shield-teleporter
}

/** Turn 1 function to prevent units from being killed before reinforcements arrive. */
preventImmediateDeath = function() {
    meleeDanger = countEnemyBotsWithMeleeCardinality(x, y)
    overallDanger = countEnemyBotsWithinDist(x, y, 1, 4)
    if (meleeDanger == 0 && canReflect()) {
        // If enemy has no melee-cardinal units, we can trust the reflector to keep us alive.
        return
    }
    if (meleeDanger == 0 && !canReflect()) {
        // We can't reflect, so 3 missile/laser units can hurt us badly.
        // TODO
    }
    if (meleeDanger >= 2) {
        // Example case: enemy has 2-3 actual melee units standing next to us.
        tryToBreakMeleeCardinality()
        teleportEscape()
    }
    if (meleeDanger == 1 && overallDanger == 3) {
        // Example case: enemy has 1 melee and 2 ranged units about to overpower us.
        tryToBreakMeleeCardinality()
        teleportEscape()
    }
    if (meleeDanger == 1 && overallDanger <= 2) {
        // Example case: enemy has units positioned to do rush or other tactical moves rather than melee us.
        if (willMeleeHit()) melee()
    }
}

tryToBreakMeleeCardinality = function() {
    // prefer moving towards CPU, then towards center.
    moveIfNoMeleeCardinality(x+1, y)
    if (y < arenaHeight/2) moveIfNoMeleeCardinality(x, y-1)
    else moveIfNoMeleeCardinality(x, y+1)

    // try any possible move that breaks melee cardinality
    moveIfNoMeleeCardinality(x, y-1)
    moveIfNoMeleeCardinality(x, y+1)
    moveIfNoMeleeCardinality(x-1, y)
}

teleportEscape = function() {
    // TODO check distance to enemy bots when choosing teleport location
    if (y <= arenaHeight/2) {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y+1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y-2)
        tryTeleport(x+4, y)
        tryTeleport(x+2, y+3)
        tryTeleport(x+2, y-3)
        tryTeleport(x+1, y+4)
        tryTeleport(x+1, y-4)
        tryTeleport(x, y+5)
        tryTeleport(x, y-5)
        tryTeleport(x-1, y+4)
        tryTeleport(x-1, y-4)
    } else {
        tryTeleport(x+5, y)
        tryTeleport(x+4, y-1)
        tryTeleport(x+3, y-2)
        tryTeleport(x+4, y+1)
        tryTeleport(x+3, y+2)
        tryTeleport(x+4, y)
        tryTeleport(x+2, y-3)
        tryTeleport(x+2, y+3)
        tryTeleport(x+1, y-4)
        tryTeleport(x+1, y+4)
        tryTeleport(x, y-5)
        tryTeleport(x, y+5)
        tryTeleport(x-1, y-4)
        tryTeleport(x-1, y+4)
    }
}