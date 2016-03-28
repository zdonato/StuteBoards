/**
 * Handles all of the registration routes.
 * { "/registration", "/registration/code" }
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
 * @route("/registration")
 * @method("POST")
 *
 * Handles the registration route.
 * Expects JSON object with email and encrypted password.
 */
router.post("/", jsonParser, function(req, res)
{
    console.log(timestamp() + "POST request made to /rest/registration.");
    DB_HELPER.addUser(req.body.email, req.body.password, function (response)
    {
        if (response.status == 200)
        {
            res.status(200).send(response);
        } else {
            res.status(500).send(response);
        }
    });
});

/**
 * @route("/registration/code")
 * @method("POST")
 *
 * Handles the confirm code registration route.
 * Expects JSON object with email and 10 digit code.
 */
router.post("/code", jsonParser, function(req, res){
    console.log(timestamp() + "POST request made to /rest/registration/code.");
    DB_HELPER.confirmUser(req.body.email, req.body.code, function (response)
    {
       if (response.error)
       {
           res.status(500).send(response);
       } else {
           res.status(200).send(response);
       }
    });
});


module.exports = router;