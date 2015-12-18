/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require('moment');
var db = require('./db');
var Page = require('./page');

var schemas = {
  content: {type: String, default: ''},
  pageId: {type: mongoose.Schema.ObjectId},
  createdBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
  createdAt: {type : Date, default : Date.now},
  createdIp: {type: String, default: '' },
  updatedAt: {type : Date, default : Date.now},
};

/**
 * Comment Schema
 */
var CommentSchema = new mongoose.Schema(schemas);

CommentSchema.index({ pageId: 1, userId: 1 });

CommentSchema.path('pageId').validate(function (pageId, fn) {
  if (!pageId) return fn(false);
  if (this.isNew || this.isModified('pageId')) {
    Page.find({ _id: pageId }).exec(function (err, pages) {
      fn(!err && pages.length !== 0);
    });
  } else fn(true);
}, db.t('comment.pageId.notExists'));

CommentSchema.path('content').validate(function (content) {
  return content.length;
}, db.t('comment.content.required'));

CommentSchema.methods.fromNow = function() {
  return moment(this.createdAt).fromNow();
};

var CommentModel = db.model('Comment', CommentSchema);

module.exports = CommentModel;
