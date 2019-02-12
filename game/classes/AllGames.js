class AllGames {
    constructor() {
        this.allGames = {};
    }
    addGame(game) {
        let key = function(game) {
            return game.gameID;
        }
        this.allGames[key(game)] = game;
    };
    contains(gameID) {
        if (this.allGames[gameID] == null) {
            return false;
        }
        return true;
    };
    grabGame(gameID) {
        if (gameID == null) {
            return null;
        }
        return this.allGames[gameID];
    };
    deleteGame(gameID) {
        console.log("deleting game");
        delete this.allGames[gameID];
    };
}
module.exports = AllGames;