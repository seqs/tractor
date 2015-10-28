var Token = require('../models/token');
var error = require('./error');

var Session = {};

/**
 * Get bearer token
 *
 * Extract token from request according to RFC6750
 *
 * @param  {Function} req
 */
Session.getBearerToken = function(req, res, next) {
  var headerToken = req.get('Authorization'),
    getToken =  req.query.accessToken,
    postToken = req.body ? req.body.accessToken : undefined;

  // Check exactly one method was used
  var methodsUsed = (headerToken !== undefined) + (getToken !== undefined) +
    (postToken !== undefined);

  if (methodsUsed > 1) {
    return next(new error.HttpError(400,
      'Only one method may be used to authenticate at a time (Auth header,  ' +
        'GET or POST).'));
  } else if (methodsUsed === 0) {
    return next(new error.HttpError(400, 'The access token was not found'));
  }

  // Header: http://tools.ietf.org/html/rfc6750#section-2.1
  if (headerToken) {
    var matches = headerToken.match(/[Bearer]\s(\S+)/);

    if (!matches) {
      return next(error.HttpError(400, 'Malformed auth header'));
    }

    headerToken = matches[1];
  }

  // POST: http://tools.ietf.org/html/rfc6750#section-2.2
  if (postToken) {
    if (req.method === 'GET') {
      return next(new error.HttpError(400,
        'Method cannot be GET When putting the token in the body.'));
    }
  }

  req.bearerToken = headerToken || postToken || getToken;
  next();
};

/**
 * checkToken
 *
 * Check it against model, ensure it's not expired
 * @param  {Function} done
 * @this   OAuth
 */
Session.checkToken = function(req, res, next) {
  Token.findOne({accessToken: req.bearerToken}).populate('user').exec(function (err, token) {
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

// app.get(Session.authorize(), function(req, res) {});
Session.authorize = function() {
  return [Session.getBearerToken, Session.checkToken];
};

module.exports = Session;
