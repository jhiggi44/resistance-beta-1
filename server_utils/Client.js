let Game = require('../game/classes/Game');

class Client {
    constructor(connection, allGames) {
        this.connection = connection;
        this.allGames = allGames;
    }
    onMessage(message) {
        if (message.type === 'utf8') {
            let data = JSON.parse(message.utf8Data);
            console.log(data);
            if (data.type === "create") {
                if (data.gameID == "" || data.player == "") {
                    this.connection.sendUTF(`{ "type" : "error", "reason": "You didn't fill in part of the form..." }`);
                }
                if (data.gameID.length > 7 || data.player.length > 10) {
                    this.connection.sendUTF(`{ "type" : "error", "reason": "Exceeded character limit of 7 for group name and 10 for your name..." }`);
                }
                if (this.allGames.contains(data.gameID)) {
                    this.connection.sendUTF(`{ "type" : "error", "reason": "A group with that name is already playing. Try another group name." }`);
                } else {
                    this.game = new Game(data.gameID);
                    this.player = this.game.establishAsCreator(data.player, this.connection);
                    this.allGames.addGame(this.game);
                }
            } else if (data.type === "join") {
                if (data.gameID == "" || data.player == "") {
                    this.connection.sendUTF(`{ "type" : "error", "reason": "You didn't fill in part of the form..." }`);
                }
                if (data.gameID.length > 7 || data.player.length > 10) {
                    this.connection.sendUTF(`{ "type" : "error", "reason": "Exceeded character limit of 7 for group name and 10 for your name..." }`);
                }
                if (!this.allGames.contains(data.gameID)) {
                    this.connection.sendUTF(`{ "type" : "error", "reason": "Game Not Found. Make sure you are using the right group name and that the game was created before joining." }`);
                } else {
                    this.game = this.allGames.grabGame(data.gameID);
                    if (this.game.isGamePaused) {
                        console.log("is Paused");
                        this.game.rejoinPlayer(this, data.player, this.connection);
                    } else if (this.game.isGameStarted) {
                        this.connection.sendUTF(`{ "type" : "error", "reason" : "Either you mistyped your group name or they started the game without you. Sorry!" }`);
                    } else {
                        this.player = this.game.establishAsPlayer(data.player, this.connection);
                    }
                }
            } else {
                 // Swith statements?
                if (data.type === "order") {
                    this.game.lobby.changePlayerOrder(data.message);
                } else if (data.type === "reveal") {
                    this.game.startGame();
                } else if (data.type === "round") {
                    this.game.startRound();
                } else if (data.type === "party") {
                    this.game.sendProposedParty(data.message);
                } else if (data.type === "vote") {
                    this.game.updateVote(data.player, data.message);
                } else if (data.type === "result") {
                    this.game.missionUpdate(data.message);
                } else {
                    console.log("unknown message: " + data.message);
                }
            }
        };
    }
}
module.exports = Client;