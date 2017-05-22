#!/usr/bin/env node

var MyApp = require('./app/app');
var http = require('http');
var propertiesReader = require('properties-reader');


var properties = propertiesReader('app/config/properties.ini');
var port = normalizePort(properties.get('webserver.PORT'));


var server = http.createServer(MyApp.app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

server.on('clientError', (err, socket) => {
    console.log("clientError: " + err.message);
});


/* ONLY FOR DEBUG
server.on('request', (req, res) => {
    res.on('finish', () => {
        console.log("FINISHED RESPONSE CODE: " + res.statusCode);
        console.log("FINISHED RESPONSE MESSAGE: " + res.statusMessage);
    });
    res.on('close', () => {
        console.log("CLOSED RESPONSE CODE: " + res.statusCode);
        console.log("CLOSED RESPONSE MESSAGE: " + res.statusMessage);
    });
});
*/



var stdin = process.openStdin();
stdin.addListener("data", function(line) {
    //the line contains return of carriage so we'll trim it
    line = line.toString().trim();
    MyApp.sendSSE(line.toString().trim());
});






/**
 * Normalize a port into a number, string, or false.
 */

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

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
    console.log('Listening on ' + bind);
}