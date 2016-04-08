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

/**
 * @route("/rest/board")
 * @method("POST")
 *
 * Handles POST method to create a board.
 * On success returns JSON with the board name and id.
 */
router.post("/", jsonParser, cookieParser(), authenticate, function(req, res){
    console.log(timestamp() + "POST request made to /rest/board.");

    DB_HELPER.createBoard(req.body.board_name, req.body.created_by, function (response) {
        if (response.error) {
            res.status(403).send(response);
        } else {
            res.status(200).send(response);
        }
    });
});

/**
 * @route("/rest/board")
 * @method("GET")
 *
 * Handles GET request to get all boards.
 * On success returns JSON with an array of boards with names and ids.
 */
router.get("/", jsonParser, cookieParser(), authenticate, function(req, res) {
    console.log(timestamp() + "GET request made to /rest/board.");

    DB_HELPER.getAllBoards(function (response) {
        if (response.error) {
            res.status(403).send(response);
        } else {
            res.send(response);
        }
    });

});

module.exports = router;