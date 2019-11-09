//!import state
//!import utils

init = function() {
    commonInitProcedures()
}

update = function() {
    commonStateUpdates()
    if (turn == 1) cloak()
}