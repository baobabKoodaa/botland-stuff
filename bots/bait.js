init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    if (turn > 10) move('right')

    if (canReflect()) {
        reflect();
    }
    if (canShield()) {
        shield();
    }
    if (y < arenaHeight/2) {
        moveTo(0, 0);
    }
    if (y >= arenaHeight/2) {
        moveTo(0, arenaHeight-1);
    }
};