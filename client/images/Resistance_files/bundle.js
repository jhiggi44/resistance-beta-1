(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
            // console.log(e.data);
            let json = JSON.parse(e.data);
            if (json.type == "create") {
                game.setGameID(json.message);
            } else if (json.type == "join") {
                if (!game.isLobbySetUp) {
                    lobby.setUpLobby();
                }
                lobby.addPlayerToLobby(`${json.message}`, order);
                order++;
            } else if (json.type == "order") {
                let newOrder = json.message.split(",");
                lobby.reorderLobby(newOrder);
            } else if (json.type == "reveal") {
                lobby.revealRole(json.message);
            } else if (json.type == "round" || json.type == "stalemate") {
                round.startRound(json.message);
            } else if (json.type == "party") {
                let party = json.message.split(",");
                round.proposeParty(party);
            } else if (json.type == "vote") {
                console.log("new vote!");
                // update players who is voting what.
            } else if (json.type == "deploy") {
                let party = json.message.split(",");
                round.deployParty(party);
                // console.log("deploying mission");
            } else if (json.type == "results") {
                round.processResults(json.message);
            } else if (json.type == "end") {
                round.endGame(json.message);
            }
        }
    }
} 
module.exports = Game;
},{"./Lobby":3,"./Round":4}],2:[function(require,module,exports){

class Landing {
    constructor(game) {
        this.game = game;
    }
    setUpLanding() {
        this.createBtn = document.getElementById("createBtn");
        this.joinBtn = document.getElementById("joinBtn");
        this.sendToLobby = document.getElementById("sendToLobby");
        let extraInputForJoining = document.getElementById("joiningPlayer");
        this.createBtn.addEventListener('click', (e) => {
            let modal = document.getElementById("landingModal");
            modal.classList.toggle('hide');
        });
        this.joinBtn.addEventListener('click', (e) => {
            let modal = document.getElementById("landingModal");
            modal.classList.toggle('hide');
            extraInputForJoining.classList.toggle('hide');
        });
        this.sendToLobby.addEventListener('click', (e) => {
            this.game.isCreator = extraInputForJoining.classList.contains("hide");
            if (this.game.isCreator) {
                let playerTag = document.getElementById("playerTag").value;
                this.game.setPlayerTag(playerTag);
                this.game.sendMsg("create", null);
            } else {
                let playerTag = document.getElementById("playerTag").value;
                let gameID = document.getElementById("gameID").value;
                this.game.setPlayerTag(playerTag);
                this.game.setGameID(gameID);
                console.log(this.game.gameID);
                this.game.sendMsg("join", null);
            }
        });
    }
}
module.exports = Landing;
},{}],3:[function(require,module,exports){
let Utils = require('./Utils');
class Lobby {
    constructor(game) {
        this.game = game;
    }
    setUpLobby() {
        let startBtn = document.getElementById("startGame");
        startBtn.addEventListener('click', (e)=> {
            this.game.sendMsg("reveal", null);
        });
        let modal = document.getElementById("landingModal");
        let landing = document.getElementById("LandingDisplay");
        this.lobby = document.getElementById("LobbyDisplay");
        modal.classList.toggle("hide");
        landing.classList.toggle("hide");
        this.lobby.classList.toggle("hide");
        if (this.game.isCreator) {
            this.lobbyList = document.getElementById("creatorLobby");
            let footer = document.getElementById("creatorFooter");
            let displayID = document.getElementById("displayGameID");
            this.lobbyList.classList.toggle("hide");
            footer.classList.toggle("hide");
            displayID.appendChild(document.createTextNode(`${this.game.gameID}`));
            this.game.isLobbySetUp = true;

            let listRef = this.lobbyList;
            let gameRef = this.game;
            Sortable.create(this.lobbyList, {
                handle: ".dragHandle",
                onEnd: function (e) {
                    let players = listRef.getElementsByTagName("li")
                    let playerArr = [];
                    for (let i = 0; i < players.length; i++) {
                        let name = players[i].dataset.tag;
                        // console.log(name);
                        playerArr.push(name);
                    }
                    gameRef.sendMsg("order", playerArr);
                }
            });
        } else {
            this.lobbyList = document.getElementById("defaultLobby");
            let footer = document.getElementById("defaultFooter");
            this.lobbyList.classList.toggle("hide");
            footer.classList.toggle("hide");
            this.game.isLobbySetUp = true;
        }
    }
    addPlayerToLobby(playerToAdd, order) {
        let li = document.createElement("li");
        li.appendChild(Utils.createElementWithTxt("span", `${order}. `));
        li.appendChild(document.createTextNode(playerToAdd));
        li.setAttribute('data-tag', `${playerToAdd}`);
        if (this.game.isCreator) {
            let img = document.createElement("img"); 
            img.setAttribute("src", "./images/order.svg");
            img.setAttribute("alt", "reorder_player_icon");
            img.classList.add("dragHandle");
            li.appendChild(img);
        }
        this.lobbyList.appendChild(li);
    }
    reorderLobby(playerArr) {
        if (this.game.isCreator) {
            Utils.clearDiv("creatorLobby");
        } else {
            Utils.clearDiv("defaultLobby");
        }
        for (let i = 0; i < playerArr.length; i++) {
            this.addPlayerToLobby(playerArr[i], i+1);
        }
    }
    revealRole(role) {
        let roleDisplay = document.getElementById("RoleDisplay");
        let startRoundBtn = document.getElementById("startRound");
        this.lobby.classList.toggle("hide");
        let roleTxt = document.createTextNode(`Your role is: ${role}`);
        roleDisplay.appendChild(roleTxt); 
        roleDisplay.classList.toggle("hide");
        startRoundBtn.addEventListener("click", (e)=> {
            this.game.sendMsg("round", null);
            roleDisplay.classList.toggle("hide");
        });
    }
}
module.exports = Lobby;
},{"./Utils":5}],4:[function(require,module,exports){
let Utils = require('./Utils');
class Round {
    constructor(game) {
        this.game = game;
        this.gameDisplay = document.getElementById("GameDisplay");
        this.pollDisplay = document.getElementById("VotingDisplay");
        this.makeProposal = document.getElementById("LeaderDisplay");
        this.deployDisplay = document.getElementById("DeployDisplay");
        this.candidatesList = document.getElementById("candidatesList");
        this.teamList = document.getElementById("teamList");
        this.sizeOfTeam = document.getElementById("sizeOfTeam");
        this.initializeListeners();
    }
    initializeListeners() {
        let pickTeamBtn = document.getElementById("pickTeamBtn");
        let thumbsUp = document.getElementById("thumbsUp");
        let thumbsDown = document.getElementById("thumbsDown");
        let succeedBtn = document.getElementById("succeedBtn");
        let sabotageBtn = document.getElementById("sabotageBtn");

        pickTeamBtn.addEventListener("click", (e) => {
            let teamMembers = teamList.getElementsByTagName("li");
            let teamArr = [];
            for (let i = 0; i < teamMembers.length; i++) {
                teamArr.push(`${teamMembers[i].innerText}`);
            }
            this.game.sendMsg("party", teamArr);
            this.makeProposal.classList.toggle("hide");
            Utils.clearDiv("candidatesList");
            Utils.clearDiv("teamList");
        });
        thumbsUp.addEventListener("click", (e)=> {
            this.game.sendMsg("vote", "yes");
            Utils.clearDiv("pollingList");
            this.pollDisplay.classList.toggle("hide");
        });
        thumbsDown.addEventListener("click", (e)=> {
            this.game.sendMsg("vote", "no");
            Utils.clearDiv("pollingList");
            this.pollDisplay.classList.toggle("hide");
        });
        succeedBtn.addEventListener("click", (e) => {
            this.game.sendMsg("result", "succeed");
            this.deployDisplay.classList.toggle("hide");
        });
        sabotageBtn.addEventListener("click", (e) => {
            this.game.sendMsg("result", "sabotage");
            this.deployDisplay.classList.toggle("hide");
        });
    }
    startRound(details) {
        this.missionLeader = details.missionLeader;
        if (details.round == 0) {
            this.gameDisplay.classList.toggle("hide");
        }

        let sortableCandidate = Sortable.create(this.candidatesList, {
            disabled: false,
            group: "mission"
        });
        let inTeam = document.getElementById("inTeam");
        let teamListRef = this.teamList;
        Sortable.create(this.teamList, {
            group: "mission",
            disabled: false,
            onStart: function (e) {
                sortableCandidate.option("disabled", false);
            },
            onAdd: function (e) {
                let numInTeam = teamListRef.getElementsByTagName("li").length;
                inTeam.innerText = `${numInTeam}/`;
                if (numInTeam == details.missionParty) {
                    // console.log("hit max");
                    sortableCandidate.option("disabled", true);
                }
            },
            onRemove: function (e) {
                let numInTeam = teamListRef.getElementsByTagName("li").length;
                inTeam.innerText = `${numInTeam}/`;
                if (numInTeam != details.missionParty) {
                    sortableCandidate.option("disabled", false);
                }
            }
        });
        if (this.missionLeader === this.game.playerTag) {
            // console.log("you're missionLeader");
            this.makeProposal.classList.toggle("hide");
            for (let i = 0; i < details.candidates.length; i++) {
                this.candidatesList.appendChild(Utils.createElementWithTxt("li", `${details.candidates[i]}`));
            }
            this.sizeOfTeam.innerText = `${details.missionParty}`;
        } else {
            // work out for people who are waiting
        }
    }
    proposeParty(party) {
        this.pollDisplay.classList.toggle("hide");
        let missionLeaderDisplay = document.getElementById("missionLeaderVote");
        let pollingList = document.getElementById("pollingList");
        missionLeaderDisplay.innerText = `${this.missionLeader}`;
        for (let i = 0; i < party.length; i++) {
            pollingList.appendChild(Utils.createElementWithTxt("li", `${party[i]}`));
        }
    }
    deployParty(party) {
        for (let i = 0; i < party.length; i++) {
            if (party[i] == this.game.playerTag) {
                this.deployDisplay.classList.toggle("hide");
            }
        }
    }
    processResults(message) {
        let isSuccess = message.result;
        let cards = document.getElementsByClassName("card");
        if (isSuccess) {
            cards[message.round - 1].classList.add("green-card");
        } else {
            cards[message.round - 1].classList.add("red-card");
        }
        this.game.sendMsg("round", null);  
    }
    endGame(winner) {
        let endDisplay = document.getElementById("EndDisplay"); 
        endDisplay.classList.toggle("hide");
        endDisplay.innerText = `${winner} win.`;
    }
}

module.exports = Round;
},{"./Utils":5}],5:[function(require,module,exports){
//Methods that I found useful to make DOM manipulation easier. 
exports.createElementWithTxt = function(typeOfElement, txtToAppend) {
    let element = document.createElement(`${typeOfElement}`);
    let txt = document.createTextNode(`${txtToAppend}`);

    element.appendChild(txt);
    return element;
}
exports.clearDiv= function(idOfDiv) {
    let div = document.getElementById(`${idOfDiv}`);
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}
},{}],6:[function(require,module,exports){
// browserify ./client/js/index.js -o ./client/bundle.js
window.onload = function() {
    let Game = require('./Game');
    let Landing = require('./Landing');
    let socket = new WebSocket("ws://" + location.host + "/game");
    let game = new Game(socket);

    // get things started with Landing Page, game class will handle the rest.
    let landing = new Landing(game);
    landing.setUpLanding();
}
},{"./Game":1,"./Landing":2}]},{},[6]);
