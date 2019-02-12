//Game.js
let Lobby = require('./Lobby');
let Rounds = require('./Rounds');
let Player = require('./Player');

class Game {
    constructor(ID) {
        // Class Data
        this.gameID = ID;
        this.players = [];
        this.playersLost = [];
        this.votes = [];
        this.party = [];
        this.missionResults = [];
        this.roundResults = [];
        this.lobby = new Lobby(this);
        this.resistanceScore = 0;
        this.spyScore = 0;
        this.roundNum = 0;
        this.turnRef = 0;
        this.stalemates = 0;
        this.playersReady = 0;
        this.isGameStarted = false;
        this.isGameOver = false;
        this.isGamePaused = false;
        this.latestMessageBroadcast = "just started";
    }

    // #### HELPER FUNCTIONS CALLED WITHIN THIS CLASS ONLY #### \\
    chooseSpy() {
        let numSpies = Math.ceil(this.players.length / 3);
        console.log("number of spies: " + numSpies);
        for (let i = 0; i < numSpies; i++) {
            let assigningSpy = true;
            while (assigningSpy) {
                let spyRef = Math.round(Math.random() * (this.players.length - 1));
                if (this.players[spyRef].role != "spy") {
                    console.log("spy chosen, player: " + this.players[spyRef].username);
                    this.players[spyRef].setRole("spy");
                    assigningSpy = false;
                }
            }
        }
    }
    broadcastMsg(message) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].connection.sendUTF(message);
        }
    };
    startStalemate() {
        this.stalemates++;
        if (this.stalemates == 3) {
            console.log("confusion fusion");
            this.awardPoints(false);
            return;
        }
        this.latestMessageBroadcast = `{ 
            "type" : "stalemate", 
            "message" : {
                "stalemate" : "${this.stalemates}",
                "missionLeader" : "${this.players[this.turnRef].username}",
                "missionParty" : "${this.rounds.missionDetails[this.roundNum - 1].partySize}",
                "candidates" : ${this.listPlayers()},
                "score" : "${this.roundResults.toString()}"
            }
        }`
        this.broadcastMsg(this.latestMessageBroadcast);
        this.turnRef++;
        if (this.turnRef >= this.players.length) {
            this.turnRef = 0;
        }
    }
    awardPoints(didResistanceSucceed) {
        if (didResistanceSucceed) {
            this.resistanceScore++;
            this.roundResults.push("resistance");
        } else {
            this.spyScore++;
            this.roundResults.push("spies");
        }
        if (this.resistanceScore == 3 || this.spyScore == 3) {
            if (didResistanceSucceed) {
                this.latestMessageBroadcast = `{ "type" : "end", "message" : "resistance" }`;
                this.broadcastMsg(this.latestMessageBroadcast);
                this.isGameOver = true;
            } else {
                this.latestMessageBroadcast = `{"type" : "end", "message" : "spies" }`;
                this.broadcastMsg(this.latestMessageBroadcast);
                this.isGameOver = true;
            }
        } else {
            console.log("starting round from award points");
            this.sendRoundInfo();
        }
    }
    listPlayers() {
        let list = "[ ";
        for (let i = 0; i < this.players.length; i++) {
            if (i > 0) {
                list += ", ";
            }
            list += `"${this.players[i].username}"`;
        }
        list += "]";
        return list;
    };
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    };

    // #### FUNCTIONS TO BE CALLED ELSEWHERE #### \\
    establishAsCreator(player, connection) {
        let creator = new Player(player, connection)
        this.lobby.addPlayer(creator);

        // because they are the creator, both create and join messages need to be sent
        let createMsg = `{ "type" : "create", "message" : "${this.gameID}" }`;
        let joinMsg = `{ "type" : "join", "message" : "${creator.username}" }`;
        creator.connection.sendUTF(createMsg);
        creator.connection.sendUTF(joinMsg);
        return creator;
    }
    establishAsPlayer(player, connection) {
        if (this.players.length == 10) {
            // console.log("game full");
            connection.sendUTF(`{ "type" : "error", "reason" : "Game is full. Max of 10 people allowed per game."}`);
            return;
        }
        this.lobby.sendExistingLobby(connection);
        let newPlayer = new Player(player, connection);
        this.lobby.addPlayer(newPlayer);
        this.broadcastMsg(`{ "type" : "join", "message" : "${newPlayer.username}" }`);
        return newPlayer;
    }
    startGame() {
        this.isGameStarted = true;
        this.chooseSpy();
        // set rounds according to number of players
        this.rounds = new Rounds(this.players.length);
        //sends each individual their role
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].connection.sendUTF(`{ "type" : "reveal", "message" : "${this.players[i].role}" }`);
        }
    };
    startRound() {
        console.log("players ready " + this.playersReady);
        console.log("players length " + this.players.length);
        this.playersReady++;
        if (this.playersReady == this.players.length) {
          this.sendRoundInfo();
        }
    };
    sendRoundInfo() {
        // reset some stuff 
        this.missionResults = [];
        this.votes = [];
        this.stalemates = 0;
        
        this.latestMessageBroadcast = `{ "type" : "round", 
            "message" : { 
                "resistance" : "${this.resistanceScore}",
                "spies" : "${this.spyScore}",
                "round" : "${this.roundNum}",
                "isDoubleFail" : "${this.rounds.missionDetails[this.roundNum].isDoubleFail}",
                "missionLeader" : "${this.players[this.turnRef].username}",
                "missionParty" : "${this.rounds.missionDetails[this.roundNum].partySize}",
                "candidates" : ${this.listPlayers()},
                "score" : "${this.roundResults.toString()}"
                }
            }`;
        this.broadcastMsg(this.latestMessageBroadcast);
        this.roundNum++;
        this.playersReady = 0;
        this.turnRef++;
        if (this.turnRef >= this.players.length) {
            this.turnRef = 0;
        }
    }
    sendProposedParty(party) {
        this.party = party.toString().split(',');
        this.broadcastMsg( `{ "type" : "party", "message" : "${party.toString()}" }`);
    };
    updateVote(username, vote) {
        this.votes.push(vote);
        this.broadcastMsg(`{ "type" : "vote", 
        "message" : { 
            "username" : "${username}", 
            "vote" : "${vote}" 
            } 
        }`);
        if (this.votes.length == this.players.length) { // if all the votes are in
            let noCount = 0;
            for (let i = 0; i < this.votes.length; i++) {
                if (this.votes[i] == "no") {
                    noCount++;
                }
                if (this.votes.length / 2 <= noCount) {
                    this.startStalemate();
                    this.votes = [];
                    this.party = [];
                    return;
                }
            }
            this.broadcastMsg(`{ "type" : "deploy", "message" : "${this.party.toString()}"}`);
        }
    };
    missionUpdate(result) {
        this.party.shift();
        this.missionResults.push(result);
        console.log(`party ${this.party}`);
        if (this.party.length == 0) {
            console.log("party empty!");
            this.shuffle(this.missionResults);
            let wasSuccess = true;
            if (this.missionResults.includes("sabotage", 0)) {
                wasSuccess = false;
            }
            this.awardPoints(wasSuccess);
        }
    };
    rejoinPlayer(client, player, newConnection) {
        if (this.playersLost.includes(player)) {
            let location = this.playersLost.indexOf(player);
            this.playersLost.splice(location, 1);
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].username == player) {
                    console.log(`player ${player} is rejoining`);
                    this.players[i] = new Player(player, newConnection);
                    client.player = this.players[i];
                    if (this.playersLost.length == 0) {
                        this.isGamePaused = false;
                        if (this.latestMessageBroadcast == "just started") {
                            this.playersReady = 0;
                            for (let i = 0; i < this.players.length; i++) {
                                this.players[i].connection.sendUTF(`{ "type" : "reveal", "message" : "${this.players[i].role}" }`);
                            }
                        } else {
                            this.missionResults = [];
                            this.votes = [];
                            console.log("broadcasting " + this.latestMessageBroadcast);
                            this.broadcastMsg(this.latestMessageBroadcast);
                        }
                    }
                    break;
                }
            }
        }
    }
    handleLostConnection(player) {
        // console.log(this.players.length);
        if (this.isGameOver || !this.isGameStarted) {
            let location = this.players.indexOf(player);
            console.log(`location is ${location}`);
            if (location > -1) {
                console.log("removing player");
                this.players.splice(location, 1);
                if (this.players.length != 0) {
                    let newLobby = "";
                    for (let i = 0; i < this.players.length - 1; i++) {
                        newLobby += `${this.players[i].username},`;
                    }
                    newLobby += `${this.players[this.players.length - 1].username}`;
                    console.log(newLobby);
                    this.lobby.changePlayerOrder(newLobby);
                }    
            }
        } else {
            this.playersLost.push(player.username);
            let msg = "";
            for (let i = 0; i < this.playersLost.length - 1; i++) {
                if (this.playersLost[i] == this.playersLost[this.playersLost.length - 2]) {
                    msg += `${this.playersLost[i]} and `;
                } else {
                    msg += `${this.playersLost[i]}, `;
                }
            }
            msg += `${this.playersLost[this.playersLost.length - 1]}'s`;
            let descriptor = "was";
            if (this.playersLost.length > 1) {
                descriptor = "were";
            }
            this.isGamePaused = true;
            this.broadcastMsg(`{ "type" : "error", "reason" : "${msg} connection ${descriptor} lost. Have them rejoin with group name ${this.gameID} or start another game." }`);
        }
    };
    isTimeToDeleteGame() {
        // console.log("still in game " + this.players.length);
        if (this.players.length == 0 || this.playersLost.length == this.players.length) {
            return true;           
        }
        return false;
    }
    // replay() {
    //     for (let i = 0; i < this.players.length; i++) {

    //     }
    //     let tempPlayersArr = this.players
    // }
}

module.exports = Game;