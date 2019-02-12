const WebSocketServer = require("./server_utils/WebSocketServer");
const wss = new WebSocketServer(8080);
wss.startServer();