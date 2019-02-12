let WSS = require('websocket').server;
let HTTP = require('./HTTP');
let Client = require('./Client');

// module imports
let AllGames = require('../game/classes/AllGames');

class WebSocketServer {
    constructor(port) {
        this.port = port;
        this.allGames = new AllGames();
    }

     // Functions to be called within this class only
    createServer() {
        // make server's socket 
        this.server = new WSS({
            httpServer: HTTP
        });
    }
    onRequest () {
        // socket handler
        this.server.on('request', (request) => { // request handler
            console.log(request.origin);
            let connection = request.accept(null, request.origin);
            let client = new Client(connection, this.allGames);
            let games = this.allGames;
            //onMessage handler
            connection.on('message', (msg) => {
                client.onMessage(msg);
            });
            connection.on('close', function() {
                if (client.game != null) {
                    client.game.handleLostConnection(client.player);
                    if (client.game.isTimeToDeleteGame()) {
                        games.deleteGame(client.game.gameID);
                    }
                }
            });
        });
    }
    // Functions to be called elsewhere
    startServer() {
        this.createServer();
        HTTP.listen(this.port, () => { 
            console.log('listening...');
        });
        this.onRequest();
    }
}

module.exports = WebSocketServer;