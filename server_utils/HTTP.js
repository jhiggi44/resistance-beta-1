let http = require('http');
let fs = require('fs');

let HTTP = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets
    // console.log((new Date()) + ' Received request for ' + request.url);
    let filePath;
    let contentType;
  
    if (request.url === "/") {
      filePath = './client/index.html';
      contentType = 'text/html';
    } else {
        filePath = `./client${request.url}`;
      
        let type = request.url.split(".");
        if (type[1] == "css") {
          contentType = 'text/css';
        } else if (type[1] == "js") {
          contentType = 'text/javascript';
        } else if (type[1] == "png") {
          contentType = 'image/png';
        } else if (type[1] == "svg") {
          contentType = 'image/svg+xml';
        } else if (type[1] == "ico") {
            contentType = 'image/x-icon';
        }
    }
     
    fs.readFile(filePath, function(error, content) {
        if (error) {
            console.log(error);
        } else {
            // console.log("writing " + filePath + " to browser.");
            response.writeHead(200, { 'Content-Type': contentType });
            if (contentType == 'image/png') {
                response.end(content, 'utf-8');
            } else {
                response.end(content, 'utf-8');
            }
        }
    });
});

module.exports = HTTP;