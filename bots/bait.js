//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()

    if (turn > 10) move('right')

    if (canShield()) {
        array1 = findEntities(IS_OWNED_BY_ME, BOT, false)
        for (i = 0; i < size(array1); i++) {
            fx = getX(array1[i])
            fy = getY(array1[i])
            if (fy < 2 || fy > arenaHeight-3) {
                if (canShield(array1[i])) shield(array1[i])
            }
        }
        shield()
    }
    if (canReflect()) {
        reflect();
    }
    if (y < arenaHeight/2) {
        moveTo(0, 0);
    }
    if (y >= arenaHeight/2) {
        moveTo(0, arenaHeight-1);
    }
};