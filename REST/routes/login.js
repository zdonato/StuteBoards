/**
 * Handles all of the login routes.
 * { "/login" }
 *
 */

var express     = require('express');
var bodyParser  = require('body-parser');
var router      = express.Router();
var DBHelper    = require('../utilities/DBHelper.js');
var timestamp   = require('../utilities/timestamp');

var DB_HELPER = new DBHelper('stuteboards_users');
var jsonParser  = bodyParser.json();

/**
 *  @route("/login")
 *  @method("POST")
 *
 *  Handles the login route.
 *  Expects JSON object with email and encrypted password.
 */
router.post("/", jsonParser, function(req,res) {
    console.log(timestamp() + "POST request made to /rest/login.");

    DB_HELPER.loginUser(req.body.email, req.body.password, function (response) {
       if (response.error)
       {
           res.status(403).send(response);
       } else {
           res.status(200).send(response);
       }
    });

});

module.exports = router;