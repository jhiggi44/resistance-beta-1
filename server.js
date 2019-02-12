const WebSocketServer = require("./server_utils/WebSocketServer");
const wss = new WebSocketServer(process.env.PORT || 5000);
wss.startServer();