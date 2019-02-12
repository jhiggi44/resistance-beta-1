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