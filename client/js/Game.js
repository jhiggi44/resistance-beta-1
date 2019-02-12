let Lobby = require('./Lobby');
let Round = require("./Round");

class Game {
    constructor(socket) {
        this.socket = socket;
        this.isCreator = false;
        this.isLobbySetUp = false;
        this.handleGameFlow();
    }
    setPlayerTag(playerTag) {
        this.playerTag = playerTag;
    }
    setGameID(gameID) {
        this.gameID = gameID;
    }
    setMissionLeader(missionLeader) {
        this.missionLeader = missionLeader;
    }
    sendMsg(type, message) {
        this.socket.send(`{
                "type" : "${type}",
                "gameID" : "${this.gameID}",
                "player" : "${this.playerTag}",
                "message" : "${message}"
            }`);
    }
    handleGameFlow() {
        let game = this;
        let lobby = new Lobby(game);
        let round = new Round(game);
        let order = 1;
        this.socket.onmessage = function(e) {
            console.log(e.data);
            let json = JSON.parse(e.data);
            // console.log(json.type);
            if (json.type == "create") {
                game.setGameID(json.message);
            } else if (json.type == "join") {
                if (!game.isLobbySetUp) {
                    lobby.setUpLobby();
                }
                if (lobby.addPlayerToLobby(`${json.message}`, order)) {
                    order++;
                } 
            } else if (json.type == "order") {
                let newOrder = json.message.split(",");
                lobby.reorderLobby(newOrder);
            } else if (json.type == "reveal") {
                lobby.revealRole(json.message);
            } else if (json.type == "round" || json.type == "stalemate") {
                round.startRound(json.message, json.type == "stalemate");
            } else if (json.type == "party") {
                let party = json.message.split(",");
                round.proposeParty(party);
            } else if (json.type == "vote") {
                console.log("new vote!");
            } else if (json.type == "deploy") {
                let party = json.message.split(",");
                round.deployParty(party);
            } 
            else if (json.type == "end") {
                round.endGame(json.message);
            } else if (json.type == "error") {
                // console.log("ERR NEEDS HANDLE");
                lobby.handleError(json.reason);
            }
        }
    }
} 
module.exports = Game;