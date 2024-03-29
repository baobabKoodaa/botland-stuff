commonInitProcedures = function() {

    turn = 0
    currLife = 2000
    currDistToClosestBot = 999
    lastDmgTakenTurn = 0
    lastDodgeTurn = -1000 // Legacy. TODO: change all bots to use lastMoveTurn instead.
    lastMoveTurn = 0
    startX = x
    startY = y

    HEAT_LONGEVITY = 2
    HEAT_SIT = 90
    HOTNESS_THRESHOLD = 90

    xCPU = arenaWidth-2
    yCPU = (arenaHeight-1)/2

    initializeSharedVariables()
    assignId()
    setAttackPriority(BOT_CPU_CHIP)
}

commonStateUpdates = function() {
    turn += 1
    prevLife = currLife
    currLife = life
    dmgTaken = max(0, prevLife-currLife)
    if (dmgTaken > 0) lastDmgTakenTurn = turn
    if (canLayMine()) hasBeenAbleToLayMine = true
    prevDistToClosestBot = currDistToClosestBot
    currDistToClosestBot = distToClosestEnemyBot(x, y)
}

initializeSharedVariables = function() {
    // sharedB reserved for shared array2 (different use cases depending on bot)
}
assignId = function() {
    id = startX*100 + startY
};

probablyHasLandMines = function() {
    if (canLayMine()) return true
    if (hasBeenAbleToLayMine) return true
    return false
}

probablyStandingOnMine = function() {
    return probablyHasLandMines() && !canLayMine()
}
