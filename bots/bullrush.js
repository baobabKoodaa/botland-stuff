//!import state
//!import utils

// Melee CPU rush

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()
    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    closestBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);

    //startSpecialDarkLingBullRush()

    if (canReflect() && (cpu.life > 1100 || !willMeleeHit(cpu)) && distanceTo(closestBot) <= 4) {
        reflect();
    }

    // If we can melee CPU let's do it!
    if (exists(cpu) && willMeleeHit(cpu)) {
        melee(cpu);
    }

    // If we can't melee CPU let's try to get closer to it
    if (x < xCPU && canMove('right')) {
        move('right');
    }
    if (y < yCPU && canMoveTo(x, y+1)) {
        moveTo(x, y+1);
    }
    if (y > yCPU && canMoveTo(x, y-1)) {
        moveTo(x, y-1);
    }

    // Fallback to missiles
    if (willMissilesHit(cpu)) {
        fireMissiles(cpu);
    }

    // We should never be able to fallback this far.
}

startSpecialDarkLingBullRush = function() {
    if (turn == 1 && canCloak()) cloak()
    if (turn <= 3) m(x+1, y)
    if (turn == 4) {
        t(xCPU, yCPU-1)
        t(xCPU, yCPU+1)
        t(xCPU, yCPU-2)
        t(xCPU, yCPU+2)
        t(xCPU+1, yCPU-1)
        t(xCPU+1, yCPU+1)
    }
    if (canZap() && abs(y-yCPU) <= 1 && !isCloaked() && life > 600) {
        zap()
    }
    if (canCloak() && !isZapping() && !isReflecting() && !isCloaked()) cloak()
    if (turn <= 9) {
        maybeMelee(xCPU, yCPU-1)
        maybeMelee(xCPU, yCPU+1)
        maybeMelee(xCPU-1, yCPU+1)
        maybeMelee(xCPU-1, yCPU-1)
        maybeMelee(xCPU+1, yCPU+1)
        maybeMelee(xCPU+1, yCPU-1)
        maybeMelee(xCPU, yCPU-2)
        maybeMelee(xCPU, yCPU+2)
    }
    if (dmgTaken > 300) {
        if (canReflect() && !isCloaked()) reflect()
        t(xCPU+1, yCPU)
    }
    if (willMeleeHit(cpu)) melee(cpu)
    n()
}

maybeMelee = function(cx, cy) {
    meleeTarget = getEntityAt(cx, cy)
    if (!exists(meleeTarget)) return
    if (!willMeleeHit(meleeTarget)) return
    // No charging allowed except on CPU!
    if (d(x, y, cx, cy) == 1) melee(meleeTarget)
}