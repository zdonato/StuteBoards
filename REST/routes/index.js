/**
 * @route("/")
 * @method("GET")
 * Handles the homepage route.
 */

var express = require("express");
var router = express.Router();

router.get("/", function (req, res)
{
    res.sendFile("index.html", { root : "public/" });
});

module.exports = router;