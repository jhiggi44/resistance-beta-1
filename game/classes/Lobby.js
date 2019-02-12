class Lobby {
    constructor(game) {
        this.game = game;
    }
    size() {
        return this.game.players.length;
    };
    addPlayer(player) {
        this.game.players.push(player);
    };
    sendExistingLobby(connection){
        for (let i = 0; i < this.game.players.length; i++) {
            let joinMsg = `{ "type" : "join", "message" : "${this.game.players[i].username}" }`;
            connection.sendUTF(joinMsg);
        }
    };
    // expects orderStr to be in this format "player1,player2,player3,etc" 
    // - no spaces after the commas.
    changePlayerOrder(orderStr) {
        console.log(orderStr);
        let orderArr = orderStr.split(",");
        let newOrder = [];
        for (let i = 0; i < orderArr.length; i++) {
            // console.log("order[i] " + orderArr[i]);
            for (let j = 0; j < this.game.players.length; j++) {
                if (orderArr[i] == this.game.players[j].username) {
                    newOrder.push(this.game.players[j]);
                }
            }
        }
        this.game.players = newOrder;
        this.game.broadcastMsg(`{ "type" : "order", "message" : "${orderStr}" }`);
    }
}

module.exports = Lobby;