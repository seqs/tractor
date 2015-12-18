var Token = require('../models/token');
var error = require('./error');

var Session = {};

Session.authorize = function(req, res, next) {
  Token.findOne({accessToken: req.cookies.token}).populate('user').exec(function (err, token) {
    if (err) return next(err);

    if (!token) {
      return next(new error.HttpError(401,
        'The access token provided is invalid.'));
    }

    if (token.expiresAt !== null &&
      (!token.expiresAt || token.expiresAt < new Date())) {
      return next(new error.HttpError(401,
        'The access token provided has expired.'));
    }

    // Expose params
    req.oauth = {token: token};
    req.user = token.user ? token.user : {id: token.userId};

    next();
  });
};

Session.getCurrentUser = function(req, res, next) {
  if (!req.cookies.token) {
    return next();
  }

  Token.findOne({accessToken: req.cookies.token}).populate('user').exec(function (err, token) {
    if (err) return next(err);

    if (!token) {
      return next();
    }

    if (token.expiresAt !== null &&
      (!token.expiresAt || token.expiresAt < new Date())) {
      return next();
    }

    // Expose params
    req.oauth = {token: token};
    req.user = token.user ? token.user : {id: token.userId};

    next();
  });
};

module.exports = Session;
