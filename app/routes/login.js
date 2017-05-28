var express = require('express');
var session = require('express-session');
var db = require('../modules/db');
var router = express.Router();




router.use(session({
    secret: 'a secret phrase',
    resave: false,
    saveUninitialized: true
}));


router.post('/doLogin', function(req, res) {
    db.getUserByLogin(req.body.name, req.body.pass,
        (err, row) => {
            if (row) {
                req.session.userId = row.id;
                res.redirect('/agents');
            } else {
                res.render('login', { 'error': { 'message': "Invalid credentials" } });
            }
        });
});


router.post('/doSignup', function(req, res) {
    db.createUser(req.body.name, req.body.pass,
        function(error) {
            if (error)
                res.render('login', { 'error': { 'message': "Database error " + error } });
            else {
                req.session.userId = this.lastID;
                res.redirect('/agents');
            }
        });
});


router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('/login');
    });
});




module.exports = router;