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
    var moment          = require('moment');
    var crypto          = require('crypto');
    var bcrypt          = require('bcrypt');
    var nodemailer      = require('nodemailer');
    var transporter     = nodemailer.createTransport('smtps://stuteboards%40gmail.com:StuteBoards123@@smtp.gmail.com');
    const saltRounds    = 10;

    // Constructor. Call with the database you want to connect to.
    function DBHelper(database) {
        this.pool = mysql.createPool({
            host : 'localhost',
            user : 'root',
            port : 8889,
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

            if (_.isUndefined(email) || _.isUndefined((password)))
            {
                console.log(timestamp() + "Error: email or password is undefined.");
                var response = {
                    error : "Error: email or password is undefined."
                };
                callback(response);
                return;
            }

            // Extract the domain name to make sure it is stevens.edu
            var domain = email.replace(/.*@/, "");

            if (domain != "stevens.edu"){
                console.log(timestamp() + "Error: Trying to register without a stevens email address.");
                var response = {
                    error : "Error: " + email + " is not a stevens email address."
                };
                callback(response);
                return;
            }

            console.log(timestamp() +  "Adding user " + email);
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    console.log(timestamp() + err);
                    var response = {
                        error : "Error connecting to database"
                    };
                    connection.release();
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
                        "VALUES (?, ?, (SELECT UUID()), ?)";
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
                                subject: 'Confirm Your Stute Boards Account!',
                                html : "<html> <body> <p> Welcome to Stute Boards! </p><br>"
                                    + "<p> Your confirmation code is: {{confirmCode}}</p>"
                                    + "<p> Please enter the code on the registration page to confirm your account. </p>"
                                     + "</body> </html>"
                            };

                            var sendConfirmation = transporter.templateSender(
                                mailOptions,
                                {
                                    from : 'Stute Boards <stuteboards@gmail.com>'
                                }
                            );

                            sendConfirmation({
                                to : email
                            },{
                                confirmCode : confirmCode
                            }, function (err, info){
                                if (err) {
                                    console.log(timestamp() + err);
                                    connection.release();
                                    callback({status : 200});
                                    return;
                                }
                                else
                                {
                                    console.log(timestamp() + "Email send to " + email + " with confirmation code "
                                        + confirmCode);
                                    console.log(timestamp() + info.response);
                                    connection.release();
                                    callback({status : 200});
                                    return;
                                }
                            }
                            );
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
            // Extract the domain name to make sure it is stevens.edu
            var domain = email.replace(/.*@/, "");

            if (domain != "stevens.edu"){
                console.log(timestamp() + "Error: Trying to register without a stevens email address.");
                var response = {
                    error : "Error: " + email + " is not a stevens email address."
                };
                callback(response);
                return;
            }

            console.log(timestamp() + "Confirming user " + email);
            this.pool.getConnection( function(err, connection) {
                if (err) {
                    console.log(timestamp() + err);
                    var response = {
                        error : "Error connecting to database"
                    };
                    connection.release();
                    callback(response);
                    return;
                }
                console.log(timestamp() + "Successfully connected to users.");

                var sql = "SELECT `confirmation`, `is_confirmed` FROM `users` WHERE email = ?";
                connection.query(sql, email, function(err, result) {
                    if (err) {
                        console.log(timestamp() + err);
                        var response = {
                            error : "Error user does not exist."
                        };
                        connection.release();
                        callback(response);
                        return;
                    }
                    // If the result is empty, then the user was never registered.
                    if (_.isEmpty(result)){
                        console.log(timestamp() + "User " + email + " does not exist.");
                        var response = {
                            error: "Error user " + email + " does not exist."
                        };
                        connection.release();
                        callback(response);
                        return;
                    }

                    // Check if the user has been confirmed already.
                    if (result[0].is_confirmed)
                    {
                        console.log(timestamp() + "User " + email + " has already been confirmed.");
                        var response = {
                            error : "User " + email + " has already been confirmed. Please log in."
                        };
                        connection.release();
                        callback(response);
                        return;
                    }

                    // User exists, check the confirmation code.
                    if (result[0].confirmation != code)
                    {
                        console.log(timestamp() + "Code " + code + " is not correct for " + email);
                        var response = {
                            error: "Error invalid code"
                        };
                        connection.release();
                        callback(response);
                        return;
                    }

                    // User is confirmed, generate auth token.
                    var token = crypto.randomBytes(32).toString('hex');
                    console.log(timestamp() + "token: " + token);
                    var expire_time = moment().add(1, 'days').format();
                    console.log(timestamp() + "expire_time: " + expire_time);

                    var insertSql = "UPDATE `users` SET `token`=?, `expire_time`=?, `is_confirmed`=1 WHERE email = ?;";
                    connection.query(insertSql, [token, expire_time, email], function (err, reuslt) {
                        if (err) {
                            console.log(timestamp() + err);
                            var response = {
                                error : "Error user cannot be authenticated"
                            };
                            connection.release();
                            callback(response);
                            return;
                        }

                        var response = {
                            token : token
                        };
                        connection.release();
                        callback(response);
                        return;
                    });

                });
            });
        },

        /**
         * Function to login a user.
         * @param email
         * @param password
         * @param callback
         */
        loginUser : function (email, password, callback)
        {
            // Extract the domain name to make sure it is stevens.edu
            var domain = email.replace(/.*@/, "");

            if (domain != "stevens.edu"){
                console.log(timestamp() + "Error: Trying to register without a stevens email address.");
                var response = {
                    error : "Error: Incorrect username or password."
                };
                callback(response);
                return;
            }

            console.log(timestamp() + "Attempt to login user " + email);
            this.pool.getConnection(function (err, connection){
                if (err) {
                    console.log(timestamp() + err);
                    var response = {
                        error : "Error connecting to database"
                    };
                    connection.release();
                    callback(response);
                    return;
                }

                var sql = "SELECT `password`, `id` FROM `users` WHERE `email`=?";
                connection.query(sql, email, function(err, result) {
                    if (err) {
                        console.log(timestamp() + err);
                        var response = {
                            error : "Error: Incorrect username or password"
                        };
                        connection.release();
                        callback(response);
                        return;
                    }

                    if (_.isEmpty(result))
                    {
                        console.log(timestamp() + "User " + email + " does not exist.");
                        var response = {
                            error: "Error: Incorrect username or password"
                        };
                        connection.release();
                        callback(response);
                        return;
                    }

                    if (result.length != 1)
                    {
                        console.log(timestamp() + "Error selecting user " + email);
                        var response = {
                            error: "Error logging in, please try again."
                        };
                        connection.release();
                        callback(response);
                        return;
                    }

                    bcrypt.compare(password, result[0].password, function (err, result) {
                        if (err)
                        {
                            console.log(timestamp() + err);
                            var response = {
                                error : "Error incorrect username or password"
                            };
                            connection.release();
                            callback(response);
                            return;
                        }

                        if (!result)
                        {
                            console.log(timestamp() + "Error logging in user " + email + ". User does not exist or " +
                                "incorrect combo.");
                            var response = {
                                error : "Error incorrect username or password"
                            };
                            connection.release();
                            callback(response);
                            return;
                        }

                        console.log(timestamp() + "User " + email + " has been authenticated.");
                        // Username + password combo is correct. Generate auth token.
                        // User is confirmed, generate auth token.
                        var token = crypto.randomBytes(32).toString('hex');
                        console.log(timestamp() + "token: " + token);
                        var expire_time = moment().add(1, 'days').format();
                        console.log(timestamp() + "expire_time: " + expire_time);

                        var insertSql = "UPDATE `users` SET `token`=?, `expire_time`=? WHERE `email` = ?; ";
                        connection.query(insertSql, [token, expire_time, email, email], function (err, result) {
                            if (err) {
                                console.log(timestamp() + err);
                                var response = {
                                    error : "Error user cannot be authenticated"
                                };
                                connection.release();
                                callback(response);
                                return;
                            }

                            var selectSql =  "SELECT `id`, `token` FROM `users` WHERE `email` = ?;"
                            connection.query(selectSql, email, function (err, result){
                                if (err) {
                                    console.log(timestamp() + err);
                                    var response = {
                                        error : "Error user cannot be authenticated"
                                    };
                                    connection.release();
                                    callback(response);
                                    return;
                                }

                                if (_.isEmpty(result))
                                {
                                    console.log(timestamp() + "Error selecting user " + email);
                                    var response = {
                                        error : "Error user cannot be authenticated"
                                    };
                                    connection.release();
                                    callback(response);
                                    return;
                                }

                                var response = {
                                    token : token,
                                    id : result[0].id
                                };

                                connection.release();
                                callback(response);
                                return;
                            });
                        });
                    });
                })
            });
        },

        /**
         * Method to create a board.
         * @param board_name
         * @param created_by 
         * @callback
         */
    };

    return DBHelper;
});