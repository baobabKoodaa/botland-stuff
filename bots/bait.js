update = function() {
    if (canReflect()) {
        reflect();
    }
    if (canShield()) {
        shield();
    }
    //move();
    if (y < arenaHeight/2) {
        moveTo(0, 0);
    }
    if (y >= arenaHeight/2) {
        moveTo(0, arenaHeight-1);
    }
};