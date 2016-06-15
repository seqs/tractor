/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require('moment');
var db = require('./db');
var Page = require('./page');

var schemas = {
  name: {type: String, default: ''},
  description: {type: String, default: ''},
  pageId: {type: mongoose.Schema.ObjectId},
  createdBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
  createdAt: {type : Date, default : Date.now},
  createdIp: {type: String, default: '' },
  updatedAt: {type : Date, default : Date.now},
};

/**
 * Attachment Schema
 */
var AttachmentSchema = new mongoose.Schema(schemas);

AttachmentSchema.index({ pageId: 1, userId: 1 });

AttachmentSchema.path('pageId').validate(function (pageId, fn) {
  if (!pageId) return fn(false);
  if (this.isNew || this.isModified('pageId')) {
    Page.find({ _id: pageId }).exec(function (err, pages) {
      fn(!err && pages.length !== 0);
    });
  } else fn(true);
}, db.t('comment.pageId.notExists'));

AttachmentSchema.path('description').validate(function (description) {
  return description.length;
}, db.t('comment.description.required'));

AttachmentSchema.methods.fromNow = function() {
  return moment(this.createdAt).fromNow();
};

var AttachmentModel = db.model('Attachment', AttachmentSchema);

module.exports = AttachmentModel;
