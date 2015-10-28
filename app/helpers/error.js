var mongoose = require('mongoose');
var _ = require('lodash');

var error = {
  notFound: function(req, res, next) {
    res.status(404);
    res.render('error.html', {message: "Page not found"});
  },

  handler: function(err, req, res, next) {
    /*
    { [ValidationError: User validation failed]
      stack: '',
      message: 'User validation failed',
      name: 'ValidationError',
      errors:
       { email:
          { [ValidatorError: Email already exists]
            properties: [Object],
            stack: '',
            message: 'Email already exists',
            name: 'ValidatorError',
            kind: 'user defined',
            path: 'email',
            value: 'seqs@lizcat.com' } } }
    */
    var parse = function(item) {
      var err = {};
      if (item.message.indexOf("error:") === 0) {
        var error = item.message.substr("error:".length).split('.');
        err = {resource: error[0], field: error[1], code: error[2]};
      } else {
        err = {resource: item.message, field: key, code: item.kind};
      }
      return err;
    };

    if (err instanceof mongoose.Error.ValidationError) {
      var errors = [];
      _.each(err.errors, function(item, key) {
        errors.push(parse(item));
      });

      res.status(422);
      res.render('error.html', {message: err.message, errors: errors});
    } else if (err instanceof error.HttpError) {
      res.status(err.status);
      res.render('error.html', {message: err.message});
    } else {
      if (next) next(err);
    }
  },

  // if (!user) return next(error.raise('user.email.notFound'));
  raise: function(message) {
    var path = message.split('.')[1];
    if (!path) return new Error('Invalid message pattern: ' + message);

    var err = new mongoose.Error.ValidationError(null);
    err.errors[path] = new mongoose.Error.ValidationError(null);
    err.errors[path].message = "error:" + message;
    return err;
  },

  HttpError: function(status, message) {
    this.name = 'HttpError';
    this.status = status || 500;
    this.message = message || 'HttpError';
    this.stack = (new Error()).stack;
  }
};

error.HttpError.prototype = new Error;

module.exports = error;
