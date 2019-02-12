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