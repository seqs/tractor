/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require('moment');
var db = require('./db');

// db.pages.update({}, {$rename:{"userId":"createdBy"}}, false, true);
var schemas = {
  title: { type: String, default: '' },
  slug: { type: String, default: '' },
  content: { type: String, default: '' },
  parentId: {type: mongoose.Schema.ObjectId},
  createdBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
  versionNo: {type: Number, min: 1},
  createdAt: {type : Date, default : Date.now},
  createdIp: {type: String, default: '' },
  updatedAt: {type : Date, default : Date.now},
  updatedBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
};

/**
 * Page Schema
 */
var PageSchema = new mongoose.Schema(schemas);

PageSchema.index({ slug: 1, parentId: 1, userId: 1 });

PageSchema.path('title').validate(function (title) {
  return title.length;
}, db.t('page.title.required'));

PageSchema.path('slug').validate(function (slug, fn) {
  if (slug && (this.isNew || this.isModified('slug'))) {
    Page.find({ slug: slug }).exec(function (err, pages) {
      fn(!err && pages.length === 0);
    });
  } else fn(true);
}, db.t('page.slug.exists'));

PageSchema.path('parentId').validate(function (parentId, fn) {
  if (parentId && (this.isNew || this.isModified('parentId'))) {
    Page.find({ _id: parentId }).exec(function (err, pages) {
      fn(!err && pages.length !== 0);
    });
  } else fn(true);
}, db.t('page.parentId.notExists'));

PageSchema.path('content').validate(function (content) {
  return content.length;
}, db.t('page.content.required'));

/**
 * Pre-save hook
 */
PageSchema.pre('save', function(next) {
  if (this.isNew) {
    this.versionNo = 1;
    return next();
  }

  var version = new Version(this.previous);
  this.versionNo = (this.versionNo || 0) + 1;

  version.save(function(err) {
    if (err) next(err);
    next();
  });
});

/**
 * Pre-remove hook
 */
PageSchema.pre('remove', function(next) {
  this.setPrevious();
  var version = new Version(this.previous);
  version.save(function(err) {
    if (err) next(err);
    next();
  });
});

PageSchema.methods.setPrevious = function() {
  this.previous = {
    pageId: this._id,
    title: this.title,
    slug: this.slug,
    content: this.content,
    parentId: this.parentId,
    userId: this.userId,
    versionNo: this.versionNo,
    createdAt: this.createdAt,
    createdIp: this.createdIp,
    updatedAt: this.updatedAt,
    updatedBy: this.updatedBy,
  };
};

PageSchema.methods.versionModel = function() {
  return Version;
};

PageSchema.methods.linkName = function() {
  return this.slug || this.id;
};

PageSchema.methods.fromNow = function() {
  return moment(this.createdAt).fromNow();
};

var Page = db.model('Page', PageSchema);

// Version
var VersionSchema = new mongoose.Schema(_.extend(schemas, {
  pageId: {type: mongoose.Schema.ObjectId}
}));

VersionSchema.index({ pageId: 1 });

var Version = db.model('Version', VersionSchema);

module.exports = Page;
