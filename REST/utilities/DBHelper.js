// Ensure define is defined.
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

// DB Helper file to interact with the SQL Database.
define(function (require) {
    var express         = require('express');
    var mysql           = require('mysql');
    var _               = require('lodash');
    var timestamp       = require('../utilities/timestamp.js');
    var crypto          = require('crypto');
    var bcrypt          = require('bcrypt');
    var nodemailer      = require('nodemailer');
    var transporter     = nodemailer.createTransport('smtps://stuteboards%40gmail.com:pass@StuteBoards123@');
    const saltRounds    = 10;

    // Constructor. Call with the database you want to connect to.
    function DBHelper(database) {
        this.pool = mysql.createPool({
            host : 'localhost',
            user : 'root',
            password : 'root',
            database : database
        });

        this.database = database;
    }

    // DBHelper.
    DBHelper.prototype = {
        // Constructor.
        constructor : DBHelper,
        /**
         * Function to add a user to the database when registering.
         * @param email
         * @param password
         * @param callback
         */
        addUser : function (email, password, callback)
        {
            console.log(timestamp() +  "Adding user " + email);
            var response = {};

            this.pool.getConnection(function (err, connection) {
                if (err) {
                    console.log(timestamp() + err);
                    var response = {
                        error : "Error connecting to database"
                    };
                    callback(response);
                    return;
                }
                console.log(timestamp() + "Successfully connected to users.");

                // Check if user exists already.
                var sql = 'SELECT * FROM users WHERE email = ?';
                connection.query(sql, email, function (err, result)
                {
                    if (!_.isEmpty(result))
                    {
                        console.log(timestamp() + "Error: User " + email + " already exists.");
                        connection.release();
                        callback({
                            status : "error",
                            error : "Error user already exists with email " + email
                        });
                        return;
                    }
                    console.log(timestamp() + "No user exists for " + email + ", creating now.");
                    // User does not exist. Add them to the DB.
                    var addUserSql = "INSERT INTO `users` (`email`, `password`, `id`, `confirmation`) " +
                        "VALUES (?, ?, UUID(), ?)";
                    var confirmCode = crypto.randomBytes(8).toString('hex');
                    bcrypt.hash(password, saltRounds, function(err, hash) {
                        if (err)
                        {
                            console.log(timestamp() + err);
                            connection.release();
                            callback({
                                status : "error",
                                error: "An Error has occurred registering. Please try again."
                            });
                            return;
                        }

                        connection.query(addUserSql, [email, hash, confirmCode], function (err, result) {
                            if (err)
                            {
                                console.log(timestamp() + err);
                                connection.release();
                                callback({
                                    status : "error",
                                    error: "An Error has occurred registering. Please try again."
                                });
                                return;
                            }

                            console.log(timestamp() + "Successfully added user " + email + " with confirmation code "
                                + confirmCode);

                            // Mail the confirmation code to the user.
                            var mailOptions = {
                                from: 'Stute Boards <stuteboards@gmail.com>',
                                to: email,
                                subject: 'Confirm Your Stute Boards Account!',
                                html:  
                            };

                            connection.release();
                            callback({ status : 200 });
                            return;
                        });
                    });
                });
            });

        },

        /**
         * Function to confirm a user by their code.
         * @param email
         * @param code
         * @param callback
         */
        confirmUser : function(email, code, callback)
        {
            console.log("Confirming user " + email);
            this.pool.getConnection( function(err, connection) {
                if (err) {
                    console.log(timestamp() + err);
                    var response = {
                        error : "Error connecting to database"
                    };
                    callback(response);
                    return;
                }
                console.log(timestamp() + "Successfully connected to users.");

                var sql = "SELECT * from `users` WHERE email = ?";
                connection.query(sql, email, function(err, result) {
                    if (err) {
                        console.log(timestamp() + err);
                        var response = {
                            error : "Error user does not exist."
                        };
                        callback(response);
                        return;
                    }
                    // If the result is empty, then the user was never registered.
                    if (_.isEmpty(result)){
                        console.log(timestamp() + "User " + email + " does not exist.");
                        var response = {
                            error: "Error user " + email + " does not exist."
                        };
                        callback(response);
                        return;
                    }

                    // User exists, check the confirmation code.
                    if (result.confirmation != code)
                    {
                        console.log(timestamp() + "Code " + code + " is not correct for " + email);
                        var response = {
                            error: "Error invalid code"
                        };
                        callback(response);
                        return;
                    }

                    // User is confirmed, generate auth token.
                    var token = crypto.randomBytes(32).toString('hex');
                    console.log(timestamp() + "token: " + token);
                    var expire_time = moment().add(1, 'days').format();
                    console.log(timestamp() + "expire_time: " + expire_time);

                    var insertSql = "INSERT INTO `users` (`token`, `expire_time`) VALUES (?, ?) WHERE email = ?";
                    connection.query(insertSql, [token, expire_time, email], function (err, reuslt) {
                        if (err) {
                            console.log(timestamp() + err);
                            var response = {
                                error : "Error user cannot be authenticated"
                            };
                            callback(response);
                            return;
                        }

                        var response = {
                            token : token
                        };
                        callback(response);
                        return;
                    });

                });
            });
        }
    };

    return DBHelper;
});