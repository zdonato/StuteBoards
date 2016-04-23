/**
 * Handles all of the board routes.
 * {
 *  "/boards",
 *  "/boards/:boardID
 * }
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
 * @route("/rest/boards")
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
 * @route("/rest/boards")
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
            res.status(200).send(response);
        }
    });

});

/**
 * @route("/rest/boards/:boardID")
 * @method("GET")
 *
 * Handles get request to a specific board.
 * On success returns JSON data of all the posts for the board.
 */
router.get("/:boardID", jsonParser, cookieParser(), authenticate, function(req, res) {
    console.log(timestamp() + "GET Request made to /rest/boards/" + req.params.boardID);

    var id = req.params.boardID;
    DB_HELPER.getAllThreadsOfBoardByID(id, function (response) {
        if (response.error) {
            res.status(403).send(response);
        }
        else {
            res.status(200).send(response);
        }
    });
});

/**
 * @route(/rest/boards/:boardID")
 * @method("POST")
 *
 * Handles posts request to make a new thread on a specific board.
 * On success returns JSON data of the id of the newly created board.
 */
router.post("/:boardID", jsonParser, cookieParser(), authenticate, function (req, res) {
    console.log(timestamp() + "POST request made to /rest/boards/" + req.params.boardID);

    var boardID = req.params.boardID;
    DB_HELPER.createNewThreadForBoard(boardID, req.body.title, req.body.created_by, function (response) {
        if (response.error) {
           res.status(403).send(response);
        }
        else {
            res.status(200).send(response);
        }
    });
});

module.exports = router;