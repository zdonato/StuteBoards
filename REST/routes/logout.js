/**
 * Handles the logout route.
 * {"/logout"}
 */

var express         = require('express');
var router          = express.Router();
var bodyParser      = require('body-parser');
var DBHelper        = require('../utilities/DBHelper.js');
var timestamp       = require('../utilities/timestamp');
var cookieParser    = require('cookie-parser');
var authenticate    = require('../middleware/authenticate');

var DB_HELPER = new DBHelper('stuteboards_users');
var jsonParser = bodyParser.json();

/**
 * @route("/rest/logout")
 * @method("POST")
 * 
 * Handles POST method to logout a user.
 * On success returns JSON with a success message.
 */
router.post("/", jsonParser, cookieParser(), function(req,res) {
    console.log(timestamp() + "POST request made to /rest/logout.");
    
    DB_HELPER.logoutUser(req.body.email, req.body.token, function (response){
       if (response.error)
       {
           res.status(500).send(response);
       } else {
           res.status(200).send(response);
       }
    });
});

module.exports = router;