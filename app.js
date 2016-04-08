// Main app logic.
var express = require("express");
var http    = require("http");
var path    = require("path");
var app     = express();

// Port to use for server.
var port = normalizePort(process.env.PORT || '9001');
app.set('port', port);

// Load all routes.
var index           = require("./REST/routes/index.js");
var registration    = require("./REST/routes/registration.js");
var login           = require("./REST/routes/login.js");
var boards          = require("./REST/routes/boards.js");

// Tell the app to use the routes.
app.use("/", index);
app.use("/rest/registration", registration);
app.use("/rest/login", login);
app.use("/rest/boards", boards);

// Serve static files from directories.
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

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