
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