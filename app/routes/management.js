var express = require('express');
var constants = require('../modules/constants');
var db = require('../modules/db');
var jobs = require('../modules/jobs');
var crawler = require('../modules/crawler');
var router = express.Router();



router.use(function(req, res, next) {
    if (!req.session.userId)
        res.render('login');
    else
        next();
});


router.get(['/', '/agents', '/notifier'], function(req, res) {

    var errorMessage = false,
        infoMessage = false;
    if (req.session.errorMessage) {
        errorMessage = req.session.errorMessage;
        req.session.errorMessage = null;
    }
    if (req.session.infoMessage) {
        infoMessage = req.session.infoMessage;
        req.session.infoMessage = null;
    }

    db.getAgentsByUserId(req.session.userId,
        (err, rows) => {

            rows.push({ id: false, url: "", selector: "", expect: "", trigger: "", condition: "", exact_time: "", frequency: "", name: "" });

            if (req.session.transientFields)
                for (var i = 0; i < rows.length; i++)
                    if (rows[i].id == req.session.transientFields.id)
                        rows[i] = req.session.transientFields;

            res.render('agents', {
                'agents': rows,
                'error': (errorMessage ? { 'message': errorMessage } : false),
                'info': (infoMessage ? { 'message': infoMessage } : false)
            });

        });
});



router.post('/testAgent', function(req, res) {
    if (!req.body.url) {
        res.status(400).send("Need to provide a URL");
        return;
    }
    if (!req.body.selector) {
        res.status(400).send("Need to provide a selector");
        return;
    }

    try {
        crawler(req.body.url, req.body.expect == constants.LIST ? [req.body.selector + ' | collapse | trim'] : req.body.selector + ' | collapse | trim')
            (function(err, result) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    if (Array.isArray(result)) {
                        var resultString = "";
                        for (var i = 0; i < result.length; i++)
                            resultString += result[i] + "\n";
                        res.send(resultString);
                    } else
                        res.send(result);
                }
            });
    } catch (e) {
        res.status(500).send(e.message);
    }
});



router.post('/handleAction', function(req, res) {
    //ACTION: DELETE
    if (req.body.delete) {
        db.deleteAgent(req.body.agentId, (error) => {
            if (error) {
                req.sesssion.errorMessage = "Error updating the database: " + error;
            } else {
                jobs.cancelJob(req.body.agentId);
                req.session.infoMessage = "Agent successfully deleted";
            }
            res.redirect('/agents');
        });
    } else {
        //if other actions first check form parameters
        if (req.body.check == constants.EXACT_TIME) {
            req.body.exactTime = req.body.time;
            req.body.frequency = "";
        } else {
            req.body.frequency = req.body.time;
            req.body.exactTime = "";
        }
        var formError = checkFormParameters(req.body);
        if (formError) {
            req.session.errorMessage = formError;
            req.session.transientFields = { id: req.body.agentId, url: req.body.url, selector: req.body.selector, expect: parseInt(req.body.expect, 10), trigger: parseInt(req.body.trigger, 10), condition: req.body.condition, frequency: req.body.frequency, exact_time: req.body.exactTime, name: req.body.name };
            res.redirect('/agents');
        } else {
            groomFormParameters(req.body);

            //ACTION: UPDATE
            if (req.body.agentId) {
                db.updateAgent({ url: req.body.url, selector: req.body.selector, expect: req.body.expect, trigger: req.body.trigger, condition: req.body.condition, frequency: req.body.frequency, exact_time: req.body.exactTime, name: req.body.name, id: req.body.agentId },
                    (error) => {
                        if (error) {
                            req.session.errorMessage = "Error updating the database: " + error;
                        } else {
                            jobs.cancelJob(req.body.agentId);
                            jobs.addJob(req.body.agentId, req.session.userId, req.body.url, req.body.selector, req.body.expect, req.body.trigger, req.body.condition, req.body.frequency, req.body.exactTime, req.body.name);
                            req.session.infoMessage = "Agent updated";
                        }
                        res.redirect('/agents');
                    });
            } else { //ACTION: CREATE
                db.createAgent({ url: req.body.url, selector: req.body.selector, expect: req.body.expect, trigger: req.body.trigger, condition: req.body.condition, frequency: req.body.frequency, exact_time: req.body.exactTime, name: req.body.name, userId: req.session.userId },
                    (error) => {
                        if (error) {
                            req.session.errorMessage = "Error updating the database: " + error;
                        } else {
                            jobs.addJob(this.lastID, req.session.userId, req.body.url, req.body.selector, req.body.expect, req.body.trigger, req.body.condition, req.body.frequency, req.body.exactTime, req.body.name);
                            req.session.infoMessage = "Agent successfully created";
                        }
                        res.redirect('/agents');
                    });
            }
        }
    }

});




/**
 * @param body json object with form parameters
 * @returns error string if any parameter is wrong, null otherwise 
 */
function checkFormParameters(body) {
    var errorMessage = null;

    if (!body.url)
        return "Need to provide a URL";

    if (!body.selector)
        return "Need to provide a selector";

    if ((body.trigger !== "0" && body.trigger !== "6") && !body.condition) {
        body.condition = " ";
        return "Need to provide a condition";
    }

    if (!body.frequency && !body.exactTime)
        return "Need to provide a frequency or exact time";

    if (body.frequency && isNaN(body.frequency))
        return "Frequency must be a number";

    if (body.exactTime) {
        var aux = body.exactTime.split(':');
        if (isNaN(body.exactTime.replace(':', '')) || aux.length > 2 || parseInt(aux[0]) > 24 || parseInt(aux[0]) < 0 || (aux[1] && (parseInt(aux[1]) < 0 || parseInt(aux[1]) > 60)))
            return "Time format must be  HH:mm  or  HH";
    }

    if (!body.name)
        return "Need to provide a name";

    return null;
}


/**
 * trims some of the parameters in body
 */
function groomFormParameters(body) {
    body.url = body.url.trim();
    body.selector = body.selector.trim();
    body.name = body.name.trim();
    body.condition = body.condition && body.condition.trim();
    body.frequency = body.frequency && body.frequency.trim();
    if (body.exactTime) {
        if (body.exactTime.split(':').length < 2)
            body.exactTime += ":00";
        var aux = body.exactTime.split(':');
        body.exactTime = aux[0].trim() + ":" + aux[1].trim();
    }
}




module.exports = router;