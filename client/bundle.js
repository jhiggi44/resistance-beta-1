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
},{"./Lobby":3,"./Round":4}],2:[function(require,module,exports){

class Landing {
    constructor(game) {
        this.game = game;
    }
    setUpLanding() {
        this.createBtn = document.getElementById("createBtn");
        this.closeModal = document.getElementById("closeModal");
        this.joinBtn = document.getElementById("joinBtn");
        this.sendToLobby = document.getElementById("sendToLobby");
        // let extraInputForJoining = document.getElementById("joiningPlayer");
        this.game.isCreator = false;
        let landing = document.getElementById("landing");
        let footer = document.getElementById("cityFooter");
        // let rejoinBtn = document.getElementById("rejoinBtn");
        // rejoinBtn.addEventListener("click", (e)=> {
        //     let lostPlayers = document.getElementById("lostList").getElementsByTagName("input");
        //     for (let i = 0; i < lostPlayers.length; i++) {
        //         if (lostPlayers[i].checked) {
        //             this.game.sendMsg()
        //         }
        //     }
        // });
        this.closeModal.addEventListener('click', (e) => {
            let modal = document.getElementById("landingModal");
            modal.classList.toggle('hide');
            landing.classList.toggle('hide');
            footer.classList.toggle("hide");
        });
        this.createBtn.addEventListener('click', (e) => {
            let modal = document.getElementById("landingModal");
            modal.classList.toggle('hide');
            landing.classList.toggle('hide');
            footer.classList.toggle("hide");
            this.game.isCreator = true;
        });
        this.joinBtn.addEventListener('click', (e) => {
            let modal = document.getElementById("landingModal");
            modal.classList.toggle('hide');
            // extraInputForJoining.classList.toggle('hide');
            landing.classList.toggle('hide');
            footer.classList.toggle("hide");
            this.game.isCreator = false;
        });
        this.sendToLobby.addEventListener('click', (e) => {
            // this.game.isCreator = extraInputForJoining.classList.contains("hide");
            if (this.game.isCreator) {
                let playerTag = document.getElementById("playerTag").value;
                let gameID = document.getElementById("gameID").value;
                this.game.setPlayerTag(playerTag);
                this.game.setGameID(gameID);
                this.game.sendMsg("create", null);
            } else {
                let playerTag = document.getElementById("playerTag").value;
                let gameID = document.getElementById("gameID").value;
                this.game.setPlayerTag(playerTag);
                this.game.setGameID(gameID);
                // console.log(this.game.gameID);
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
        this.lobby = document.getElementById("LobbyDisplay");
        this.roleDisplay = document.getElementById("RoleDisplay");
        this.ErrorDisplay = document.getElementById("ErrorDisplay");
        let startRoundBtn = document.getElementById("startRound");
        startRoundBtn.addEventListener("click", (e)=> {
            this.game.sendMsg("round", null);
            this.roleDisplay.classList.toggle("hide");
            let GameDisplay = document.getElementById("GameDisplay");
            let WaitDisplay = document.getElementById("WaitDisplay");
            GameDisplay.classList.remove("hide");
            WaitDisplay.classList.remove("hide");
        });
        let playAgainBtn = document.getElementById("reloadGame");
        playAgainBtn.addEventListener("click", (e) => {
            // document.getElementById("endDisplay").classList.add("hide");
            // this.lobby.classList.remove("hide");
            // Utils.clearDiv("defaultLobby");
            // Utils.clearDiv("creatorLobby");
            // this.game.sendMsg("replay", null);
            location.reload();
        });
    }
    setUpLobby() {
        let modal = document.getElementById("landingModal");
        let landing = document.getElementById("LandingDisplay");
        
        this.startBtn = document.getElementById("startGame");
        this.startBtn.addEventListener('click', (e)=> {
            this.game.sendMsg("reveal", null);
        });
        
        // hide modal & landing, display lobby
        modal.classList.toggle("hide");
        landing.classList.toggle("hide");
        this.lobby.classList.toggle("hide");
        if (this.game.isCreator) {
            this.lobbyList = document.getElementById("creatorLobby");
            let defaultLobby = document.getElementById("defaultLobby");
            defaultLobby.classList.toggle("hide");
            let creatorDisplay = document.getElementById("creatorDisplay");
            creatorDisplay.classList.toggle("hide");

            let code = document.getElementById("code");
            code.appendChild(document.createTextNode(`${this.game.gameID}`));
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
            this.game.isLobbySetUp = true;
        }
    }
    addPlayerToLobby(playerToAdd, order) {
        if (this.lobbyList.getElementsByTagName("li").length == 10) {
            return false;
        }
        let li = document.createElement("li");
        li.classList.add("collection-item");
        li.classList.add("grey");
        // li.classList.add("darken-3");
        li.classList.add("yellow-text");
        li.classList.add("center-align");
        let innerDiv = document.createElement("div");
        let span = Utils.createElementWithTxt("span", `${order}.`);
        span.classList.add("left");
        span.classList.add("white-text");
        innerDiv.appendChild(span);
        innerDiv.appendChild(document.createTextNode(`${playerToAdd}`));
        if (this.game.isCreator) {
            let a = document.createElement("a"); 
            a.classList.add("secondary-content");
            let i = document.createElement("i");
            i.classList.add("material-icons");
            i.classList.add("white-text");
            i.classList.add("dragHandle");
            i.appendChild(document.createTextNode("drag_handle"));
            a.appendChild(i);
            innerDiv.appendChild(a);
        }
        li.setAttribute('data-tag', `${playerToAdd}`);
        li.appendChild(innerDiv);
        this.lobbyList.appendChild(li);
        if (this.lobbyList.getElementsByTagName("li").length >= 5) {
            if (this.startBtn.classList.contains("disabled")) {
                this.startBtn.classList.remove("disabled"); 
            }   
        } else {
            if (!this.startBtn.classList.contains("disabled")) {
                this.startBtn.classList.add("disabled"); 
            }  
        }
        return true;
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
        if (!document.getElementById("ErrorDisplay").classList.contains("hide")) {
            document.getElementById("ErrorDisplay").classList.add("hide");
            document.getElementById("WaitDisplay").classList.add("hide");
            document.getElementById("GameDisplay").classList.add("hide");
        }
        if (!document.getElementById("landingModal").classList.contains("hide")) {
            document.getElementById("landingModal").classList.add("hide");
            document.getElementById("LandingDisplay").classList.add("hide");
            document.getElementById("cityFooter").classList.remove("hide");
        }
        // hide the lobby
        if (!this.lobby.classList.contains("hide")) {
            this.lobby.classList.add("hide");
        }
        
        // if (roleDisplay.classList.contains("hide")) {
            this.roleDisplay.classList.remove("hide");
            let spyReveal = document.getElementById("spyReveal");
            let defaultReveal = document.getElementById("defaultReveal");
            if (role == "spy") {
                if (spyReveal.classList.contains("hide")) {
                    defaultReveal.classList.add("hide");
                    spyReveal.classList.remove("hide");
                }
            }
        // }
        // let spyReveal = document.getElementById("spyReveal");
        // let defaultReveal = document.getElementById("defaultReveal");
        // if (role == "spy") {
        //     defaultReveal.classList.toggle("hide");
        //     spyReveal.classList.toggle("hide");
        // }
    }
    handleError(err) {
        if (!document.getElementById("ErrorDisplay").classList.contains("hide")) {
            document.getElementById("ErrorDisplay").classList.add("hide");
        }
        // let ErrorDisplay = document.getElementById("ErrorDisplay");
        let errMsg = document.getElementById("errMsg");
        this.ErrorDisplay.classList.remove("hide");
        errMsg.innerHTML = `${err}`;

        // let errExtra = document.getElementById("errExtra");
        // if (err.extra != null) {
        //     let lostPlayers = err.extra.split(",");
        //     let firstLostPlayer = document.getElementById("firstLostPlayer");
        //     firstLostPlayer.appendChild(document.createTextNode(`${lostPlayers[0]}`));
        //     if (lostPlayers.length > 1) {
        //         for (let i = 1; i < lostPlayers.length; i++) {
        //             let lostList = document.getElementById("lostList");
        //             let p = document.createElement("p");
        //             let label = document.createElement("label");
        //             let input = document.createElement("input");
        //             input.setAttribute("name", "lost_player");
        //             input.setAttribute("type", "radio");
        //             let span = Utils.createElementWithTxt("span", `${lostPlayers[i]}`);
                    
        //             label.appendChild(input);
        //             label.appendChild(span);
        //             p.appendChild(label);
        //             lostList.prepend(p);
        //         }
        //     }
        // } else {
        //     if (!errExtra.classList.contains("hide")) {
        //         errExtra.classList.add("hide");
        //         Utils.clearDiv("errExtra");
        //     }
        // }
    }
}
module.exports = Lobby;
},{"./Utils":5}],4:[function(require,module,exports){
let Utils = require('./Utils');
class Round {
    constructor(game) {
        this.game = game;
        this.gameDisplay = document.getElementById("GameDisplay");
        this.waitDisplay = document.getElementById("WaitDisplay");
        this.pollDisplay = document.getElementById("VotingDisplay");
        this.makeProposal = document.getElementById("LeaderDisplay");
        this.deployDisplay = document.getElementById("DeployDisplay");
        this.endDisplay = document.getElementById("EndDisplay");
        this.candidatesList = document.getElementById("candidatesList");
        this.teamList = document.getElementById("teamList");
        this.sizeOfTeam = document.getElementById("sizeOfTeam");
        this.infoFeed = document.getElementById("infoFeed");
        this.missionStatus = document.getElementById("missionStatus");
        this.stalemates = 0;
        this.initializeListeners();
    }
    initializeListeners() {
        this.pickTeamBtn = document.getElementById("pickTeamBtn");
        let thumbsUp = document.getElementById("thumbsUp");
        let thumbsDown = document.getElementById("thumbsDown");
        let succeedBtn = document.getElementById("succeedBtn");
        let sabotageBtn = document.getElementById("sabotageBtn");
        let resetGameBtn = document.getElementById("resetGame");

        this.pickTeamBtn.addEventListener("click", (e) => {
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
            if (this.waitDisplay.classList.contains("hide")) {
                this.waitDisplay.classList.remove("hide");
            }
            this.infoFeed.innerHTML = 'Others still need to vote...'; 
        });
        thumbsDown.addEventListener("click", (e)=> {
            this.game.sendMsg("vote", "no");
            Utils.clearDiv("pollingList");
            this.pollDisplay.classList.toggle("hide");
            if (this.waitDisplay.classList.contains("hide")) {
                this.waitDisplay.classList.remove("hide");
            }
            this.infoFeed.innerHTML = 'Others still need to vote...'; 
        });
        succeedBtn.addEventListener("click", (e) => {
            this.game.sendMsg("result", "succeed");
            this.deployDisplay.classList.toggle("hide");
            if (this.waitDisplay.classList.contains("hide")) {
                this.waitDisplay.classList.remove("hide");
            }
            // this.game.sendMsg("round", null); 
            this.infoFeed.innerHTML = 'Mission in progress...'; 
        });
        sabotageBtn.addEventListener("click", (e) => {
            this.game.sendMsg("result", "sabotage");
            this.deployDisplay.classList.toggle("hide");
            if (this.waitDisplay.classList.contains("hide")) {
                this.waitDisplay.classList.remove("hide");
            }
            // this.game.sendMsg("round", null); 
            this.infoFeed.innerHTML = 'Mission in progress...';  
        });
        resetGameBtn.addEventListener("click", (e)=> {
            location.reload();
        });
    }
    startRound(details, isStalemate) {
        // handing lost connection scenario, reset current round
        if (!document.getElementById("ErrorDisplay").classList.contains("hide")) {
            document.getElementById("ErrorDisplay").classList.add("hide");
            let displays = document.getElementsByClassName("display");
            for (let i = 0; i < displays.length; i++) {
                if (!displays[i].classList.contains("hide")) {
                    displays[i].classList.add("hide");
                }
            }
        } else if (!document.getElementById("landingModal").classList.contains("hide")) {
            document.getElementById("cityFooter").classList.remove("hide");
            document.getElementById("landingModal").classList.add("hide");
            document.getElementById("GameDisplay").classList.remove("hide");
        }
        //handling stalemate
        if (isStalemate) {
            this.stalemates++;
        } else {
            this.stalemates = 0;
        }

        this.setupLists(details);
        this.processResults(details.score);
        if (this.missionLeader == this.game.playerTag) {
            this.infoFeed.innerHTML = ""; 
            // console.log("you're missionLeader");
            if (!this.waitDisplay.classList.contains("hide")) {
                this.waitDisplay.classList.add("hide");
            }
            this.makeProposal.classList.toggle("hide");
            for (let i = 0; i < details.candidates.length; i++) {
                let li = Utils.createElementWithTxt("li", `${details.candidates[i]}`);
                li.classList.add("collection-item");
                li.classList.add("grey");
                li.classList.add("game-green-text");
                li.classList.add("center-align");
                this.candidatesList.appendChild(li);
            }
            this.sizeOfTeam.innerText = `/ ${details.missionParty}`;
            inTeam.innerText = "0";
        } else {
            // work out for people who are waiting
            if (this.waitDisplay.classList.contains("hide")) {
                this.waitDisplay.classList.remove("hide");
            }
            this.infoFeed.innerHTML = `Mission leader ${this.missionLeader} is choosing their squad...`;
        }
    }
    setupLists(details) {
        this.missionLeader = details.missionLeader;
        let candidateListRef = this.candidatesList;
        let sortableCandidate = Sortable.create(this.candidatesList, {
            disabled: false,
            group: "mission",
            onAdd: function(e) {
                let item = candidateListRef.getElementsByTagName("li")[e.newIndex];
                item.classList.remove("green");
                item.classList.remove("accent-2");
                item.classList.add("grey");
                let numInTeam = teamListRef.getElementsByTagName("li").length;
                inTeam.innerText = `${numInTeam}`;
                if (numInTeam == details.missionParty) {
                    // console.log("hit max");
                    console.log("party size " + details.missionParty);
                    console.log("in party " + numInTeam);
                    inTeam.classList.remove("red-text");
                    inTeam.classList.add("green-text");
                    inTeam.classList.add("text-accent-2");
                    pickTeamBtnRef.classList.remove("disabled");
                    // sortableCandidate.option("disabled", true);
                } else if (inTeam.classList.contains("green-text")){
                    inTeam.classList.add("red-text");
                    inTeam.classList.remove("green-text");
                    inTeam.classList.remove("text-accent-2");
                    pickTeamBtnRef.classList.add("disabled");
                }
            }
        });
        let inTeam = document.getElementById("inTeam");
        let teamListRef = this.teamList;
        let pickTeamBtnRef = this.pickTeamBtn;
        Sortable.create(this.teamList, {
            group: "mission",
            disabled: false,
            onStart: function (e) {
                sortableCandidate.option("disabled", false);
            },
            onAdd: function (e) {
                let numInTeam = teamListRef.getElementsByTagName("li").length;
                let item = teamListRef.getElementsByTagName("li")[e.newIndex];
                item.classList.remove("yellow");
                item.classList.add("green");
                item.classList.add("accent-2");
                inTeam.innerText = `${numInTeam}`;
                if (numInTeam == details.missionParty) {
                    console.log("party size " + details.missionParty);
                    console.log("in party " + numInTeam);
                    inTeam.classList.remove("red-text");
                    inTeam.classList.add("green-text");
                    inTeam.classList.add("text-accent-2");
                    pickTeamBtnRef.classList.remove("disabled");
                    // sortableCandidate.option("disabled", true);
                } else if (inTeam.classList.contains("green-text")){
                    inTeam.classList.add("red-text");
                    inTeam.classList.remove("green-text");
                    inTeam.classList.remove("text-accent-2");
                    pickTeamBtnRef.classList.add("disabled");
                }
            }
        });
    }
    proposeParty(party) {
        if (!this.waitDisplay.classList.contains("hide")) {
            this.waitDisplay.classList.add("hide");
        }
        Utils.clearDiv("pollingList");
        this.infoFeed.innerText = "";
        this.pollDisplay.classList.toggle("hide");
        let missionLeaderDisplay = document.getElementById("missionLeaderVote");
        let pollingList = document.getElementById("pollingList");
        missionLeaderDisplay.innerHTML= `${this.missionLeader}`;
        for (let i = 0; i < party.length; i++) {
            let li = Utils.createElementWithTxt("li", `${party[i]}`);
            li.classList.add("collection-item");
            li.classList.add("grey");
            li.classList.add("game-green-text");
            li.classList.add("center-align");
            pollingList.appendChild(li);
        }
    }
    deployParty(party) {
        for (let i = 0; i < party.length; i++) {
            if (party[i] == this.game.playerTag) {
                if (!this.waitDisplay.classList.contains("hide")) {
                    this.waitDisplay.classList.add("hide");
                }
                this.deployDisplay.classList.toggle("hide");
                this.infoFeed.innerHTML = '';
            } 
        }
        //use includes instead????
        if (!party.includes(this.game.playerTag, 0)) {
            this.infoFeed.innerHTML = 'Mission in progress... ';
        }
    }
    processResults(scoreList) {
        let scoreArr = scoreList.split(",");
        let cards = document.getElementsByClassName("card");
        // let status = this.missionStatus;
        if (scoreList != "") {
            for (let i = 0; i < scoreArr.length; i++) {
                if (scoreArr[i] == "resistance" && !cards[i].classList.contains("green")) {
                    cards[i].classList.add("green", "accent-2");
                    // cards[i].classList.add("accent-2");
                } else if (!cards[i].classList.contains("red")) {
                    cards[i].classList.add("red");
                }
            }
            if (this.stalemates > 0) {
                this.missionStatus.classList.remove("red-text", "green-text", "text-accent-2");
                this.missionStatus.classList.add("yellow-text");
                this.missionStatus.innerHTML = `STALEMATE_${this.stalemates}`;
            } else if (scoreArr[scoreArr.length - 1] == "resistance") {
                this.missionStatus.classList.remove("red-text", "yellow-text");
                this.missionStatus.classList.add("green-text", "text-accent-2");
                this.missionStatus.innerHTML = "SUCCESS!";
            } else {
                this.missionStatus.classList.add("red-text");
                this.missionStatus.classList.remove("green-text", "text-accent-2", "yellow-text");
                this.missionStatus.innerHTML = "SABATOGE!";
            }
        }
        // this.game.sendMsg("round", null);  
    }
    endGame(winner) { 
        this.endDisplay.classList.remove("hide");
        let winnerDisplay = document.getElementById("winnerDisplay");
        let endMsg = document.getElementById("endMsg");
        winnerDisplay.classList.add("white-text");
        winnerDisplay.classList.add("center-align");
        if (winner == "resistance") {
            endMsg.classList.remove("red-text");
            endMsg.classList.add("green-text", "text-accent-2");
            endMsg.innerHTML = "The Resistance prevails, despite spy infiltration!";
            winnerDisplay.innerHTMl = "The Resistance Wins.";
        } else {
            endMsg.classList.remove("green-text", "text-accent-2");
            endMsg.classList.add("red-text");
            endMsg.innerHTML = "Spy infiltration causes the Resistance to crumble.";
            winnerDisplay.innerHTML = "The Spies Win.";
        }
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
window.onload = function () {

// let socket = new WebSocket("ws://" + location.host + "/game");
    let Game = require('./Game');
    let Landing = require('./Landing');
    let WebSocketClient = require('websocket').w3cwebsocket;
    let address = location.host;

    let client = new WebSocketClient(`ws://${address}/`);
    let game;

    client.onopen = function() {
        console.log('WebSocket Client Connected');
        game = new Game(client);   

        // get things started with Landing Page, game class will handle the rest.
        let landing = new Landing(game);
        landing.setUpLanding();
    }
    client.onerror = function() {
        console.log('Connection Error');
    };
}
},{"./Game":1,"./Landing":2,"websocket":7}],7:[function(require,module,exports){
var _global = (function() { return this; })();
var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;
var websocket_version = require('./version');


/**
 * Expose a W3C WebSocket class with just one or two arguments.
 */
function W3CWebSocket(uri, protocols) {
	var native_instance;

	if (protocols) {
		native_instance = new NativeWebSocket(uri, protocols);
	}
	else {
		native_instance = new NativeWebSocket(uri);
	}

	/**
	 * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
	 * class). Since it is an Object it will be returned as it is when creating an
	 * instance of W3CWebSocket via 'new W3CWebSocket()'.
	 *
	 * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
	 */
	return native_instance;
}
if (NativeWebSocket) {
	['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function(prop) {
		Object.defineProperty(W3CWebSocket, prop, {
			get: function() { return NativeWebSocket[prop]; }
		});
	});
}

/**
 * Module exports.
 */
module.exports = {
    'w3cwebsocket' : NativeWebSocket ? W3CWebSocket : null,
    'version'      : websocket_version
};

},{"./version":8}],8:[function(require,module,exports){
module.exports = require('../package.json').version;

},{"../package.json":9}],9:[function(require,module,exports){
module.exports={
  "_from": "websocket",
  "_id": "websocket@1.0.28",
  "_inBundle": false,
  "_integrity": "sha512-00y/20/80P7H4bCYkzuuvvfDvh+dgtXi5kzDf3UcZwN6boTYaKvsrtZ5lIYm1Gsg48siMErd9M4zjSYfYFHTrA==",
  "_location": "/websocket",
  "_phantomChildren": {},
  "_requested": {
    "type": "tag",
    "registry": true,
    "raw": "websocket",
    "name": "websocket",
    "escapedName": "websocket",
    "rawSpec": "",
    "saveSpec": null,
    "fetchSpec": "latest"
  },
  "_requiredBy": [
    "#USER",
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/websocket/-/websocket-1.0.28.tgz",
  "_shasum": "9e5f6fdc8a3fe01d4422647ef93abdd8d45a78d3",
  "_spec": "websocket",
  "_where": "/Users/jordanhiggins/Desktop/personal_projects/rg",
  "author": {
    "name": "Brian McKelvey",
    "email": "theturtle32@gmail.com",
    "url": "https://github.com/theturtle32"
  },
  "browser": "lib/browser.js",
  "bugs": {
    "url": "https://github.com/theturtle32/WebSocket-Node/issues"
  },
  "bundleDependencies": false,
  "config": {
    "verbose": false
  },
  "contributors": [
    {
      "name": "Iñaki Baz Castillo",
      "email": "ibc@aliax.net",
      "url": "http://dev.sipdoc.net"
    }
  ],
  "dependencies": {
    "debug": "^2.2.0",
    "nan": "^2.11.0",
    "typedarray-to-buffer": "^3.1.5",
    "yaeti": "^0.0.6"
  },
  "deprecated": false,
  "description": "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
  "devDependencies": {
    "buffer-equal": "^1.0.0",
    "faucet": "^0.0.1",
    "gulp": "git+https://github.com/gulpjs/gulp.git#4.0",
    "gulp-jshint": "^2.0.4",
    "jshint": "^2.0.0",
    "jshint-stylish": "^2.2.1",
    "tape": "^4.9.1"
  },
  "directories": {
    "lib": "./lib"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "homepage": "https://github.com/theturtle32/WebSocket-Node",
  "keywords": [
    "websocket",
    "websockets",
    "socket",
    "networking",
    "comet",
    "push",
    "RFC-6455",
    "realtime",
    "server",
    "client"
  ],
  "license": "Apache-2.0",
  "main": "index",
  "name": "websocket",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/theturtle32/WebSocket-Node.git"
  },
  "scripts": {
    "gulp": "gulp",
    "install": "(node-gyp rebuild 2> builderror.log) || (exit 0)",
    "test": "faucet test/unit"
  },
  "version": "1.0.28"
}

},{}]},{},[6]);
