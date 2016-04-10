/**
 * Authentication middleware
 *
 */

var express         = require('express');
var bodyParser      = require('body-parser');
var cookieParser    = require('cookie-parser');
var timestamp       = require('../utilities/timestamp');
var DBHelper        = require('../utilities/DBHelper.js');

var DB_HELPER = new DBHelper('stuteboards_users');
var jsonParser  = bodyParser.json();

/**
 * Authenticate function.
 * @param req
 * @param res
 * @param next
 */
var authenticate = function(req, res, next)
{
    if (!req.cookies || !req.cookies.email || !req.cookies.token)
    {
        console.log(timestamp() + "No user to authenticate");
        res.status(403).send({ error: "You are not authorized to access this page."});
    } else {
        DB_HELPER.authByUsernameAndToken(req.cookies.email, req.cookies.token, function (response) {

            if (!response){
                res.status(403).send({ error : "You are not authorized to access this page."});
            } else {
                // User is okay, call next middleware.
                next();
            }
        });
    }
};

module.exports = authenticate;