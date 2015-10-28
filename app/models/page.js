/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var db = require('./db');

/**
 * Page Schema
 */
var PageSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  slug: { type: String, default: '' },
  content: { type: String, default: '' },
  parentId: {type: mongoose.Schema.ObjectId},
  createdAt: {type : Date, default : Date.now},
  createdIp: { type: String, default: '' },
  updatedAt: {type : Date, default : Date.now},
});

PageSchema.index({ slug: 1, parentId: 1 });

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

PageSchema.path('content').validate(function (content) {
  return content.length;
}, db.t('page.content.required'));

/**
 * Pre-save hook
 */
PageSchema.pre('save', function(next) {
  if (!this.isNew) return next();

  /*
  if (!db.validatePresenceOf(this.password)) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
  */
  next();
});

var Page = db.model('Page', PageSchema);

module.exports = Page;
