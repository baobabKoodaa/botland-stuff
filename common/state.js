commonInitProcedures = function() {
    initializeSharedVariables();
    assignId();
    turn = 0;
    currLife = 2000;
    currDistToClosestBot = 999;
}

commonStateUpdates = function() {
    turn += 1;
    prevLife = currLife;
    currLife = life;
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