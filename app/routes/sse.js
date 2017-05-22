var express = require('express');
var auth = require('basic-auth');
var sseChannel = require('../modules/SSE');
var db = require('../modules/db');
var router = express.Router();



router.use(function(req, res, next) {
    var user = auth(req);

    if (!user) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    } else
        db.getUserByLogin(user.name, user.pass,
            (err, row) => {
                if (row) {
                    req.body.userId = row.id;
                    next();
                } else {
                    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
                    return res.sendStatus(401);
                }
            });
});


router.post('/check', function(req, res) {
    getAllNotifications(req.body.userId, res);
});


router.get('/connect', function(req, res) {
    sseChannel.addClient(req, res);
    getAllNotifications(req.body.userId, res, sseChannel);
    /*sseChannel.send({ data: 'eventless message!' });
    sseChannel.send({ event: 'hello', data: 'this is just a hello message' });
    sseChannel.send({ event: 'disconnect' });*/
});



function getAllNotifications(userId, res, channel = null) {

    db.serialize(function() {

        db.getNotificationsByUserId(userId,
            (err, rows) => {
                if (err)
                    console.log("Error retreiving notifications from the DB");

                if (channel !== null) {
                    for (var i in rows) {
                        channel.send(JSON.stringify({ 'agent': rows[i].name, 'text': rows[i].text, 'time': rows[i].time }), [res]);

                        db.deleteNotification(rows[i].id,
                            (error) => {
                                if (error)
                                    console.log("Error deleting notification with id " + rows[i].id);
                            });
                    }
                } else
                    res.json({ newNotifications: rows.length });
            });
    });
}




module.exports = router;