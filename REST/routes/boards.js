/**
 * Handles all of the board routes.
 * {"/board"}
 *
 */

var express         = require('express');
var bodyParser      = require('body-parser');
var router          = express.Router();
var DBHelper        = require('../utilities/DBHelper.js');
var timestamp       = require('../utilities/timestamp');
var cookieParser    = require('cookie-parser');
var authenticate    = require("../middleware/authenticate.js");

var DB_HELPER   = new DBHelper('stuteboards_users');
var jsonParser  = bodyParser.json();

router.post("/", jsonParser, cookieParser(), authenticate, function(req, res){

});

module.exports = router;