var express = require('express');
var _ = require('lodash');
var User = require('../models/user');
var Token = require('../models/token');
var error = require('../helpers/error');
var Session = require('../helpers/session');
var router = express.Router();

router.get('/signup', function(req, res, next) {
  res.render('users/signup.html', {user: {}});
});

router.post('/signup', function(req, res, next) {
  var user = new User(_.pick(req.body, ['email', 'password', 'passwordConfirm']));
  user.save(function(err, result) {
    if (err) return next(err);
    // res.status(201);
    // res.json(result.toObject());
    res.redirect('/users/login');
  });
});

router.get('/login', function(req, res, next) {
  res.render('users/login.html', {user: {}});
});

router.get('/logout', function(req, res, next) {
  res.clearCookie('token');
  res.redirect('/users/login');
});

router.post('/login', function(req, res, next) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) return next(err);
    if (!user) return next(error.raise('user.email.notFound'));
    if (user.authenticate(req.body.password)) {
      var token = new Token();
      token.user = user;
      token.save(function(err, result) {
        // res.json(_.pick(result, ['accessToken', 'refreshToken', 'expiresIn']));
        res.cookie('token', result.accessToken);
        res.redirect('/');
      });
    } else {
      return next(error.raise('user.password.invalid'));
    }
  });
});

router.get('/current', Session.authorize, function(req, res, next) {
  res.json(_.pick(req.user, ['email', 'username', 'createdAt']));
});

router.post('/forgotPassword', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/resetPassword', function(req, res, next) {
  res.send('respond with a resource');
});


module.exports = router;
