init = function() {
    prevLife = 2000;
}

update = function() {

    actualPrevLife = prevLife;
    prevLife = life;

    xCPU = arenaWidth-2;
    yCPU = (arenaHeight-1)/2
    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    closestBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);

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
};