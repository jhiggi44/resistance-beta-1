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