var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var handlebars = require('hbs');
var sseChannel = require('./modules/SSE');
var db = require('./modules/db');
var jobs = require('./modules/jobs');

var loginRoute = require('./routes/login');
var managementRoute = require('./routes/management');
var sseRoute = require('./routes/sse');


//set up the web app
var app = express();
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'hbs');
app.set('views', './app/views');
app.use(express.static(path.join(__dirname, 'static')));

handlebars.registerHelper('ifEquals', function(v1, v2, options) {
    if (v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});


//start all the registered agents
db.getAgents((err, row) => {
    jobs.addJob(row.id, row.user_id, row.url, row.selector, row.expect, row.trigger, row.condition, row.frequency, row.exact_time, row.name);
});



//set up web app routers
app.use('/sse', sseRoute);
app.use('/notifier', loginRoute);
app.use('/notifier', managementRoute);



// if we got here, the request didn't match anything. Forward a 404 to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//error handler
app.use((err, req, res, next) => {
    console.log("Captured server error: " + err.message + "\n" + err.stack);

    if (res && !res.headersSent) {
        res.locals.message = err.message;
        res.locals.error = err;
        // render the error page
        res.status(err.status || 500);
        res.render('error');
    }
});




function sendSSE(text) {
    var time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    //sseChannel.send({ event: 'keyboard', data: text });
    sseChannel.send(JSON.stringify({ 'agent': "Keyboard", 'text': text, 'time': time }));
}


function exitHandler() {
    sseChannel.close();
    db.close();
    process.exit();
}

//handle app closing
//process.on('exit', exitHandler.bind(null, { exit: true }));
process.on('exit', exitHandler);
//catches ctrl+c event
process.on('SIGINT', exitHandler);
//catches uncaught exceptions
process.on('uncaughtException', exitHandler);




module.exports = { app: app, sendSSE: sendSSE };