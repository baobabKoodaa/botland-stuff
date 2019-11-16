//!import state
//!import utils

init = function() {

    commonInitProcedures()
}

update = function() {

    commonStateUpdates()

    if (!areSensorsActivated()) {
        if (canActivateSensors()) activateSensors()
        if (willArtilleryHit()) fireArtillery()
        w()
    }

    target = findClosestEnemyBot()
    if (exists(target) && willArtilleryHit()) fireArtillery(target)
    if (willArtilleryHit()) fireArtillery()

    m(x+1, y)
}