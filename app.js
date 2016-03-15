// Main app logic.

var express = require("express");
var http    = require("http");
var path    = require("path");
var app     = express();

// Port to use for server.
var port = normalizePort(process.env.PORT || '9000');
app.set('port', port);

// Load all routes.
var index = require("./REST/routes/index.js");


// Tell the app to use the routes.
app.use("/", index);

// Serve static files from directories.
app.use('/', express.static(path.join(__dirname, 'public')));

// Start the server.
var server = http.createServer(app);
server.listen(port);


// Function to normalize the port.
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}