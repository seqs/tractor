/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var hat = require('hat');
var db = require('./db');
var config = require('../../config');

/**
 * Token Schema
 */
var TokenSchema = new mongoose.Schema({
  accessToken: {type: String, default: ''},
  refreshToken: {type: String, default: ''},
  user: {type: mongoose.Schema.ObjectId, ref: 'User'},
  expiresAt: {type: Date},
  revoked: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now}
});

TokenSchema.virtual('expiresIn').get(function() {
  return config.token.expiresIn / 1000;
});

/**
 * Pre-save hook
 */
TokenSchema.pre('save', function(next) {
  if (!this.isNew) return next();

  var rack = hat.rack();
  this.accessToken = rack();
  this.refreshToken = rack();
  this.expiresAt = (Date.now() + config.token.expiresIn);
  next();
});

TokenSchema.statics.createToken = function(userId) {

};

var Token = db.model('Token', TokenSchema);

module.exports = Token;
