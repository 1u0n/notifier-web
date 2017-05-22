var schedule = require('node-schedule');
var sseChannel = require('./SSE');
var constants = require('./constants');
var db = require('./db');
var crawler = require('./crawler');


var jobsList = [];

exports.cancelJob = function(id) {
    for (var i = 0; i < jobsList.length; i++)
        if (jobsList[i].agentId == id) {
            if (typeof jobsList[i].cancel === 'function')
                jobsList[i].cancel();
            else
                clearInterval(jobsList[i]);
            jobsList.splice(i, 1);
        }
}


exports.addJob = function(agentId, userId, url, selector, expect, trigger, condition, frequency, exactTime, name) {
    var job;
    if (exactTime) {
        var time = exactTime.split(":");
        job = schedule.scheduleJob((time.length > 1 ? time[1] + " " + time[0] : time[0]) + ' * * *', function() {
            crawl(agentId);
        });
    } else {
        crawl(agentId, userId, url, selector, expect, trigger, condition, "", name);
        job = setInterval(function() { crawl(agentId); }, frequency * 60000);
    }
    job.agentId = agentId;
    jobsList.push(job);
}


exports.jobsListLength = function() {
    return jobsList.length;
}


/*
tr@html      
:nth-of-type(2)          
['table.ratesTable@class']        
['tr:contains(Euro) td:nth-of-type(3)']
'tr:contains(Euro) td:nth-of-type(3)
['.tags > li | trim']
'.tags', [['li']]    --> result[3][4]...
'tr:contains(Euro) td:eq(2)'
'table.ratesTable a[href*="from=EUR"] | trim'
*/


function crawl(agentId, userId, url, selector, expect, trigger, condition, lastValue, name) {

    if (arguments.length == 1)
        db.getAgentById(agentId,
            (err, row) => {
                crawl(row.id, row.user_id, row.url, row.selector, row.expect, row.trigger, row.condition, row.last_value, row.name);
            });

    else {
        crawler(url, expect == constants.LIST ? [selector + ' | collapse | trim'] : selector + ' | collapse | trim')(function(err, result) {

            if (err) return console.log("Error while crawling " + url + " " + err);

            var notification = checkCondition(result, expect, trigger, condition, lastValue);
            if (notification)
                notify(userId, agentId, name, notification);

            //update agent's lastValue, except if waiting for new n elements and no notification generated yet
            if (trigger != constants.NEW_N_ELEMENTS || notification)
                db.updateAgentLastValue(agentId, Array.isArray(result) ? JSON.stringify(result) : result,
                    (error) => {
                        if (error)
                            console.log("DB error on agent update: " + error);
                    });
        });
    }
}


function checkCondition(result, expect, trigger, condition, lastValue) {

    var notification = null;
    switch (trigger) {
        case constants.VALUE_CHANGES:
            if (result != lastValue)
                notification = "New value: " + result;
            break;
        case constants.VALUE_EQUALS:
            if (result == condition)
                notification = "New value is equals to " + result;
            break;
        case constants.VALUE_NOT_EQUALS:
            if (result != condition)
                notification = "New value " + result + " is not equals to " + condition;
            break;
        case constants.VALUE_BIGGER_THAN:
            if (result > condition)
                notification = "New value " + result + " is bigger than " + condition;
            break;
        case constants.VALUE_LESS_THAN:
            if (result < condition)
                notification = "New value " + result + " is less than " + condition;
            break;
        case constants.VALUE_CONTAINS:
            var words = condition.split(',');
            for (var i = 0; i < words.length; i++)
                if (words[i].toLowerCase().trim() && result.indexOf(words[i].toLowerCase().trim()) > -1)
                    notification = "New value " + result + " contains " + words[i].trim();
            break;
        case constants.NEW_ELEMENTS:
            if (JSON.stringify(result) != lastValue)
                notification = "New elements";
            break;
        case constants.NEW_N_ELEMENTS:
            var firstOldLine = lastValue ? JSON.parse(lastValue)[0] : null;
            for (var i = 0; i < result.length; i++) {
                if (i >= condition) {
                    notification = "More than " + condition + " new elements";
                    break;
                }
                if (result[i] == firstOldLine)
                    break;
            }
            break;
        case constants.NEW_ELEMENT_CONTAINS:
            var words = condition.split(',');
            var firstOldLine = lastValue ? JSON.parse(lastValue)[0] : null;
            for (var i = 0; i < result.length; i++) {
                if (result[i] === firstOldLine)
                    break;
                for (var j = 0; j < words.length; j++)
                    if (words[j].toLowerCase().trim() && result[i].indexOf(words[j].toLowerCase().trim()) > -1)
                        notification = "New element contains '" + words[j].trim() + "'";
            }
            break;
    }
    return notification;
}


function notify(userId, agentId, name, notification) {

    for (var i = 0; i < sseChannel.connectedClientsList.length; i++) {
        if (sseChannel.connectedClientsList[i].id == userId) {
            var time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            sseChannel.send(JSON.stringify({ agent: name, text: notification, time: time }), [sseChannel.connectedClientsList[i].res]);
            return;
        }
    }

    db.createNotification(userId, agentId, notification,
        (error) => {
            if (error)
                console.log("Error on notification insert: " + error + "\nwhile inserting notification: " + notification + "  for agentId: " + agentId);
        });
}