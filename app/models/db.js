var mongoose = require('mongoose');
var config = require('../../config');

// Connect to mongodb
var connect = function() {
  var options = {server: {socketOptions: {keepAlive: 1}, autoIndex: false}};
  return mongoose.createConnection(config.db, options);
};

var db = connect();

// Error handler
db.on('error', function (err) {
  console.log(err);
});

// Reconnect when closed
db.on('disconnected', function () {
  db = connect();
});

db.t = function(message) {
  return "error:" + message;
};

/**
 * Validations
 */
db.validatePresenceOf = function (value) {
  return value && value.length;
};

module.exports = db;
