/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var db = require('./db');

/**
 * User Schema
 */
var UserSchema = new mongoose.Schema({
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  passwordHash: { type: String, default: '' },
  createdAt  : {type : Date, default : Date.now}
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.passwordHash = this.encryptPassword(password);
  })
  .get(function() { return this._password });

/**
 * Validations
 */
var validatePresenceOf = function (value) {
  return value && value.length;
};

// the below validations only apply if you are signing up traditionally
UserSchema.path('email').validate(function (email) {
  return email.length;
}, db.t('user.email.required'));

UserSchema.path('email').validate(function (email, fn) {
  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    User.find({ email: email }).exec(function (err, users) {
      fn(!err && users.length === 0);
    });
  } else fn(true);
}, db.t('user.email.exists'));

// UserSchema.path('username').validate(function (username) {
//   return username.length;
// }, 'Username cannot be blank');

UserSchema.path('passwordHash').validate(function (passwordHash) {
  return passwordHash.length;
}, db.t('user.password.required'));

/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
  if (!this.isNew) return next();

  if (!validatePresenceOf(this.password)) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
});

/**
 * Authenticate - check if the passwords are the same
 *
 * @param {String} plainText
 * @return {Boolean}
 * @api public
 */
UserSchema.methods.authenticate = function (plainText) {
  return bcrypt.compareSync(plainText, this.passwordHash);
};

/**
 * Encrypt password
 *
 * @param {String} password
 * @return {String}
 * @api public
 */
UserSchema.methods.encryptPassword = function (password) {
  if (!password) return '';
  var encrypred;
  try {
    encrypred = bcrypt.hashSync(password);
    return encrypred;
  } catch (err) {
    console.log(err);
    return '';
  }
};

var User = db.model('User', UserSchema);

module.exports = User;
