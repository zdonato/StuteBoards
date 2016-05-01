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
    var config          = require('../utilities/config.js')
    const saltRounds    = 10;

    // Constructor. Call with the database you want to connect to.
    function DBHelper(database) {
        this.pool = mysql.createPool(_.extend(config, {
            database : database
        }));

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
                    callback(response);
                    return;
                }
                console.log(timestamp() + "Successfully connected to users.");

                // Check if user exists already.
                var sql = 'SELECT `email` FROM users WHERE email = ?';
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
                    var addUserSql = "INSERT INTO `users` (`email`, `password`, `confirmation`) " +
                        "VALUES (?, ?, ?)";
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
            if (_.isUndefined(email) || _.isUndefined(password))
            {
                console.log(timestamp() + "Error: no email or password provided.");
                var response = {
                    error : "Error no credentials provided"
                };
                callback(response);
                return;
            }

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
         * Method to logout a user.
         * @param email
         * @param token
         * @param callback
         */
        logoutUser : function (email, token, callback) 
        {
            var response = {};
            if (_.isUndefined(email) || _.isUndefined(token))
            {
                console.log(timestamp() + "Error: no email or token provided.");

                response.error = "Error no credentials provided";

                callback(response);
                return;
            }

            this.pool.getConnection(function (err, connection) {
                if (err) {
                    console.log(timestamp() + err);
                    response.error = "Error connecting to database";
                    connection.release();
                    callback(response);
                    return;
                }

                var sql = "UPDATE `users` SET `token`=NULL, `expire_time`=NULL WHERE `email`=? AND `token`=?";
                connection.query(sql, [email, token], function (err, result){
                    if (err || result.affectedRows === 0) {
                        if (err) {console.log(timestamp() + err);}
                        console.log(timestamp() + "Error logging out user " + email);
                        response.error = "Error logging out user " + email;
                        connection.release();
                        callback(response);
                        return;
                    }

                    response.message = email + " has been logged out";
                    callback(response);
                    connection.release();
                    return;
                });
            });
        },

        /**
         * Method to create a board.
         * @param board_name
         * @param created_by
         * @param callback
         */
        createBoard : function(board_name, created_by, callback)
        {
            if (_.isUndefined(board_name) || _.isUndefined((created_by)))
            {
                console.log(timestamp() + "Error: board name or created by undefined");
                var response = {
                    error : "Error: No board name supplied, or created by not supplied"
                };
                callback(response);
                return;
            }

            console.log(timestamp() + "Connecting to boards...");
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

                // First check if the board name exists already
                var sql = "SELECT `name` FROM `boards` WHERE `name` = ?";
                connection.query(sql, board_name, function (err, result){
                    if (err)
                    {
                        console.log(timestamp() + "Error connecting to database");
                        var response = {
                            error : "Error connecting to database"
                        };
                        callback(response);
                        return;
                    }

                    if (!_.isEmpty(result))
                    {
                        console.log(timestamp() + "Error: Board " + board_name + " already exists.");
                        connection.release();
                        callback({
                            status : "error",
                            error : "Error board already exists with name " + board_name
                        });
                        return;
                    }

                    // Board does not exist, create it.
                    var insertSql = "INSERT INTO `boards` (`name`, `created_by`, `created_on`) " +
                        "VALUES (?, ?, ?)";

                    // Generate created time.
                    var created_on = moment().format();
                    connection.query(insertSql, [board_name, created_by, created_on], function(err, result) {
                        if (err)
                        {
                            console.log(timestamp() + "Error creating board " + board_name);
                            var response = {
                                error : "Error creating board " + board_name
                            };
                            connection.release();
                            callback(response);
                            return;
                        }

                        // Query for the newly created board to send back the ID.
                        var sql = "SELECT `id`, `name` FROM `boards` WHERE `name` = ?";
                        connection.query(sql, board_name, function (err, result){
                            if (err || _.isEmpty(result))
                            {
                                console.log(timestamp() + "Error creating board " + board_name);
                                var response = {
                                    error : "Error creating board " + board_name
                                };
                                connection.release();
                                callback(response);
                                return;
                            }

                            var response = {
                                board_name : result[0].name,
                                id : result[0].id
                            };

                            console.log(timestamp() + "Created board " + board_name + " with id " + response.id);
                            connection.release();
                            callback(response);
                            return;
                        });
                    });
                });
            });
        },

        /**
         * Method get all boards.
         * @param callback
         */
        getAllBoards : function(callback)
        {
            var sql = "SELECT `name`, `id`, `created_on` FROM `boards`";
            this.pool.getConnection(function (err, connection) {

                if (err) {
                    console.log(timestamp() + err);
                    var response = {
                        error : "Error connecting to database"
                    };
                    callback(response);
                    return;
                }

                connection.query(sql, function (err, result) {
                    if (err || _.isEmpty(result))
                    {
                        console.log(timestamp() + "Error: There are no boards created");
                        if (err) {console.log(timestamp() + err);}
                        var response = {
                            error : "Error: There are no boards created"
                        };
                        connection.release();
                        callback(response);
                        return;
                    }

                    var response = {
                        boards : result
                    };
                    connection.release();
                    callback(response);
                    return;
                });
            });
        },

        /**
         * Method to get a user by their username from the DB.
         * @param username
         * @param token
         * @param callback
         */
        authByUsernameAndToken : function (username, token, callback)
        {

            if (_.isUndefined(username) || _.isUndefined(token))
            {
                console.log(timestamp() + "Username or token was undefined");
                var response = {
                    error : "No username or token was sent"
                };
                callback(response);
                return;
            }

            var sql = "SELECT `token`, `expire_time` FROM `users` WHERE `email` = ?";
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    console.log(timestamp() + err);
                    callback(false);
                    return;
                }

                connection.query(sql, username, function (err, result) {
                    if (err || _.isEmpty(result) || result.length != 1) {
                        console.log(timestamp() + err);
                        connection.release();
                        callback(false);
                        return;
                    }

                    // Compare the provided token and the DB token.
                    var DB_token = result[0].token;
                    var expire_time = result[0].expire_time;
                    console.log(expire_time);
                    console.log(moment().format());
                    if (token != DB_token || moment().isAfter(moment(expire_time)))
                    {
                        console.log(timestamp() + "Error: user's token does not match the token in the database" +
                            " or is expired");
                        connection.release();
                        callback(false);
                        return;
                    }

                    // User is authenticated.
                    console.log(timestamp() + "User " + username + " has been authenticated.");
                    connection.release();
                    callback(true);
                });
            });
        },

        /**
         * Method to get all the threads of a given board.
         *
         * @param boardID
         * @param callback
         */
        getAllThreadsOfBoardByID : function(boardID, callback)
        {
            if (_.isUndefined(boardID) || boardID === "" || boardID < 0) {
                console.log(timestamp() + "Error: no id specified");
                var response = {
                    error : "Error: No board id supplied"
                };
                callback(response);
                return;
            }

            var sql = "SELECT `id`, `title`, `last_comment`, `parent_id`, `created_on` FROM `threads`" +
                "WHERE `parent_id` = ?";
            var getBoardNameSql = "SELECT `name` FROM `boards` WHERE id = ?";
            this.pool.getConnection(function (err, connection) {
                if (err)
                {
                   console.log(timestamp() + err);
                   var response = {
                       error : "Error connecting to database"
                   };
                   callback(response);
                   return;
                }

                // Get the baord name.
                connection.query(getBoardNameSql, boardID, function (err, result) {
                    if (err) {
                        console.log(timestamp() + err);
                        connection.release();
                        var response = {
                            error : "Error fetching threads for this board"
                        };
                        callback(response);
                        return;
                    }

                    if (_.isUndefined[result] || result.length == 0)
                    {
                        console.log(timestamp() + "Board " + boardID + " does not exist");
                        connection.release();
                        var response = {
                            error: "Board does not exist"
                        };
                        callback(response);
                        return;
                    }
                    var boardName = result[0].name;

                    connection.query(sql, boardID, function (err, result) {
                        if (err) {
                            console.log(timestamp() + err);
                            connection.release();
                            var response = {
                                error : "Error fetching threads for this board"
                            };
                            callback(response);
                            return;
                        }

                        if (_.isEmpty(result) || result.length < 1)
                        {
                            console.log(timestamp() + "There are no threads for board with id " + boardID);
                            connection.release();
                            var response = {
                                error : "Error: There are no threads for this board"
                            };
                            callback(response);
                            return;
                        }

                        var response = {
                            id : boardID,
                            board_name : boardName,
                            threads : result
                        };

                        console.log(timestamp() + "Sending back " + response.threads.length + " threads");
                        callback(response);
                        connection.release();
                    });
                });
            });
        },

        /**
         * Method to create a new thread for a board.
         *
         * @param boardID
         * @param title
         * @param created_by
         * @param callback
         */
        createNewThreadForBoard : function (boardID, title, created_by, callback)
        {
            var response = {};
            if (_.isUndefined(boardID) || isNaN(boardID) || boardID < 0) {
                console.log(timestamp() + "Error: no id specified");
                response.error = "Error: No board id supplied";
                callback(response);
                return;
            }

            if (_.isUndefined(title) || title === "")
            {
                console.log(timestamp() + "Error: title is empty");
                response.error = "Error: No title supplied";
                callback(response);
                return;
            }

            if (_.isUndefined(created_by) || isNaN(created_by) || created_by < 0)
            {
                console.log(timestamp() + "Error: no created_by supplied");
                response.error = "Error: No created_by supplied";
                callback(response);
                return;
            }

            this.pool.getConnection(function (err, connection) {
                if (err)
                {
                    console.log(timestamp() + err);
                    response.error = "Error connecting to database";
                    callback(response);
                    return;
                }

                var sql = "INSERT INTO `threads` (`title`, `parent_id`, `created_by`, `created_on`) VALUES" +
                        "(?,?,?,?)";
                var created_on = moment().format();
                connection.query(sql, [title, boardID, created_by, created_on], function (err, result) {
                    if (err)
                    {
                        console.log(timestamp() + "Error creating thread " + title);
                        console.log(timestamp() + err);
                        response.error = "Error creating thread " + title;
                        connection.release();
                        callback(response);
                        return;
                    }

                    // Query for the new thread to return it's id.
                    var sql = "SELECT `id` FROM `threads` WHERE `title` = ? AND `created_by` = ? AND `created_on` = ?";
                    connection.query(sql, [title, created_by, created_on], function (err, result){
                        if (err || _.isEmpty(result) || result.length != 1)
                        {
                            console.log(timestamp() + "Error fetching thread " + title);
                            if (err) { console.log(timestamp() + err); }
                            response.error = "Error fetching thread " + title;
                            connection.release();
                            callback(response);
                            return;
                        }

                        response.id = result[0].id;
                        connection.release();
                        callback(response);
                        return;
                    })
                })
            });
        },

        /** Method to get all comments of a thread
         * @param boardID,
         * @param threadID,
         * @param callback
         */
        getAllCommentsOnThread : function (boardID, threadID, callback) {
            var response = {};
            if (_.isUndefined(boardID) || boardID === "" || boardID < 1 || isNaN(boardID))
            {
                console.log(timestamp() + "Error invalid boardID supplied");
                response.error = "Error invalid boardID supplied";
                callback(response);
                return;
            }
            if (_.isUndefined(threadID) || threadID === "" || threadID < 1 || isNaN(threadID))
            {
                console.log(timestamp() + "Error invalid threadID supplied");
                response.error = "Error invalid threadID supplied";
                callback(response);
                return;
            }

            this.pool.getConnection(function (err, connection) {
                if (err)
                {
                    console.log(timestamp() + err);
                    response.error = "Error conencting to database.";
                    callback(response);
                    return;
                }

                var sql = "SELECT `id`, `body`, `created_on`, `parent_id` FROM `comments` WHERE `parent_id` = ?";
                connection.query(sql, threadID, function (err, result) {
                    if (err)
                    {
                        console.log(timestamp() + err);
                        response.error = "Error connecting to database.";
                        connection.release();
                        callback(response);
                        return;
                    }

                    if (_.isUndefined(result) || result.length == 0){
                        console.log(timestamp() + "Thread " + threadID + " has no comments or does not exist.");
                        response.error = "Thread does not exist or has no comments.";
                        connection.release();
                        callback(response);
                        return;
                    }

                    response.comments = result;
                    connection.release();
                    callback(response);
                    return;
                });
            });
        },

        /**
         * Method to post a comment on a thread.
         *
         * @param boardID,
         * @param threadID,
         * @param body
         * @param created_by
         * @param callback
         */
        postCommentOnThread : function(boardID, threadID, body, created_by, callback) {
            var response = {};

            if (_.isUndefined(boardID) || boardID === "" || boardID < 1 || isNaN(boardID))
            {
                console.log(timestamp() + "Error invalid boardID supplied");
                response.error = "Error invalid boardID supplied";
                callback(response);
                return;
            }
            if (_.isUndefined(threadID) || threadID === "" || threadID < 1 || isNaN(threadID))
            {
                console.log(timestamp() + "Error invalid threadID supplied");
                response.error = "Error invalid threadID supplied";
                callback(response);
                return;
            }
            if (_.isUndefined(body) || body === "")
            {
                console.log(timestamp() + "Error no body supplied");
                response.error = "Error no body supplied";
                callback(response);
                return;
            }
            if (_.isUndefined(created_by) || created_by === "" || created_by < 1 || isNaN(created_by))
            {
                console.log(timestamp() + "Error invalid created_by supplied");
                response.error = "Error invalid created_by supplied";
                callback(response);
                return;
            }

            this.pool.getConnection(function (err, connection){
                if (err)
                {
                    console.log(err);
                    response.error = "There was an error connecting to the database.";
                    callback(response);
                    return;
                }

                var sql = "INSERT INTO `comments` (`body`, `parent_id`, `created_on`, `created_by`) VALUES (?, ?, ?, ?)";
                var created_on = moment().format();
                connection.query(sql, [body, threadID, created_on, created_by], function (err, result) {
                    if (err)
                    {
                        console.log(timestamp() + "Error creating comment");
                        console.log(timestamp() + err);
                        response.error = "Error creating comment";
                        connection.release();
                        callback(response);
                        return;
                    }

                    // Update the thread to show the last comment.
                    var updateSql = "UPDATE `threads` SET `last_comment`=? WHERE `id`=?";
                    connection.query(updateSql, [created_on, threadID], function (err, result) {
                        if (err) {
                            console.log(timestamp() + "Error updating thread with last comment");
                            console.log(timestamp() + err);
                            response.error = "Error updating thread with last comment.";
                            connection.release();
                            callback(response);
                            return;
                        }

                        response.message = "Successfully added comment";
                        callback(response);
                        connection.release();
                        return;
                    })
                });
            });
        }

    };

    return DBHelper;
});