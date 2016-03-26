var moment = require('moment');

var timestamp = function () {
    return '[' + moment().format('MMMM Do YYYY, h:mm:ss a') + ']: ';
};

module.exports = timestamp;
