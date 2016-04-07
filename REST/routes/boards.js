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

var DB_HELPER   = new DBHelper('stuteboards_boards');
var jsonParser  = bodyParser.json();

router.post("/", jsonParser, cookieParser(), function(req, res){
    console.log(timestamp() + "POST request made to /rest/login.");

    DB_HELPER.createBoard(req.body.board_name, req.body.created_by, function (response) {
        if (response.error) {
            res.status(403).send(response);
        } else {
            res.status(200).send(response);
        }
    });
});

module.exports = router;