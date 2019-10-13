init = function() {

    prevLife = 2000;
}

update = function() {

    actualPrevLife = prevLife; // hacky
    prevLife = life; // need to do this update here

    xCPU = arenaWidth-2;
    yCPU = (arenaHeight-1)/2
    d = getDistanceTo(xCPU, yCPU)

    if (canMove('right')) {
        move('right');
    }

    // Typically we want to stay back in early stages of the round, fire a couple shots from afar with sensors.
    if (d == 7 && canActivateSensors()) {
        activateSensors();
    }

    // If we can artillery CPU let's do it!
    cpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    closestBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(cpu) && willArtilleryHit(cpu)) {
        if (canReflect() && life < actualPrevLife-50 && distanceTo(closestBot) <= 4) {
            reflect();
        }
        fireArtillery(cpu);
    }

    // We can't fire at CPU, reflect before moving in.
    if (canReflect() && distanceTo(closestBot) <= 5) {
        reflect();
    }

    // If we can't fire at CPU let's try to get closer to it. We are already as right as we can go, so move vertically.
    if (y < yCPU && canMoveTo(x, y+1)) {
        moveTo(x, y+1);
    }
    if (y > yCPU && canMoveTo(x, y-1)) {
        moveTo(x, y-1);
    }

    // Fallback to things we can do without moving from our hiding spot.
    if (willArtilleryHit()) fireArtillery();
    if (willMissilesHit()) fireMissiles();
    if (canActivateSensors()) activateSensors();
};