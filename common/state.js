commonInitProcedures = function() {
    initializeSharedVariables();
    assignId();
    turn = 0;
    currLife = 2000;
    currDistToClosestBot = 999
    lastDodgeTurn = -1000
    startX = x
    startY = y

    HEAT_LONGEVITY = 4
    HEAT_SIT = 30
    DMG_RESPONSE_THRESHOLD = 61
    HOTNESS_THRESHOLD = 90

    xCPU = arenaWidth-2;
    yCPU = (arenaHeight-1)/2
}

commonStateUpdates = function() {
    turn += 1;
    prevLife = currLife;
    currLife = life;
    if (canLayMine()) hasBeenAbleToLayMine = true
    prevDistToClosestBot = currDistToClosestBot;
    currDistToClosestBot = distToClosestEnemyBot(x, y);
}

initializeSharedVariables = function() {
    if (!exists(sharedA)) sharedA = 0 // Next free id
    if (!exists(sharedB)) sharedB = initializeHeatmap()
}
assignId = function() {
    id = sharedA;
    sharedA += 1;
};

probablyHasLandMines = function() {
    if (canLayMine()) return true
    if (hasBeenAbleToLayMine) return true
    return false
}

probablyStandingOnMine = function() {
    return probablyHasLandMines() && !canLayMine()
}
