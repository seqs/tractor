var express = require('express');
var _ = require('lodash');
var marked = require('marked');
var validator = require('validator');
var Page = require('../models/page');
var error = require('../helpers/error');
var router = express.Router();

var childrenCount = function(req, res, next) {
  if (!req.page) {
    req.count = 0;
    return next();
  }

  Page.count({parentId: req.page._id}, function(err, count) {
    if (err) return next(err);
    req.count = count;
    next();
  });
};

var childrenPager = function(req, res, next) {
  var perPage = 20;
  var skip = Math.max(_.parseInt(req.query.skip) || 0, 0);
  req.pager = {
    count: req.count,
    skip: skip,
    perPage: perPage,
    next: skip + perPage,
    prev: skip - perPage,
  };
  next();
};

var getPage = function(req, res, next) {
  var query = {};
  var slug = req.params.slug || "home";
  validator.isMongoId(slug) ? query._id = slug : query.slug = slug;
  Page.findOne(query, function(err, page) {
    if (err) return next(err);
    req.page = page;
    next();
  });
};

var findChildren = function(req, res, next) {
  if (!req.page) {
    req.children = null;
    return next();
  }

  Page.find({parentId: req.page._id})
    .sort({createdAt: 1})
    .skip(req.pager.skip)
    .limit(req.pager.perPage)
    .exec(function(err, pages) {
      if (err) return next(err);
      req.children = pages;
      next();
    });
};

var checkChildren = function(req, res, next) {
  Page.findOne({parentId: req.params.id}, function(err, page) {
    if (err) return next(err);
    console.log(page);
    if (page) return next(error.raise('page.id.relationExists'));
    next();
  });
};

var show = function(req, res, next) {
  if (!req.page) return res.redirect('/pages/new?slug=' + (req.params.slug || "home"));
  req.page.rendered = marked(req.page.content || "");
  res.render('pages/show.html', {
    page: req.page,
    children: req.children,
    pager: req.pager,
  });
};


router.get('/new', function(req, res, next) {
  res.render('pages/new.html', {
    action: "/pages",
    page: {
      title: _.startCase(req.query.slug),
      slug: _.snakeCase(req.query.slug),
      content: "",
      parentId: req.query.parentId
    }
  });
});

router.get('/', getPage, childrenCount, childrenPager, findChildren, show);
router.get('/:slug', getPage, childrenCount, childrenPager, findChildren, show);

router.post('/', function(req, res, next) {
  var data = {
    title: _.trim(req.body.title),
    content: req.body.content,
    createdAt: new Date(),
    createdIp: req.ip,
  };

  if (req.body.slug) {
    data.slug = _.snakeCase(req.body.slug);
  }

  if (req.body.parentId && validator.isMongoId(req.body.parentId)) {
    data.parentId = req.body.parentId;
  }

  Page.create(data, function(err, page) {
    console.log(err, page);
    if (err) return next(err);
    res.redirect('/pages/' + page._id.toString());
  });
});

router.get('/:id/edit', function(req, res, next) {
  Page.findOne({_id: req.params.id}, function(err, page) {
    if (err) return next(err);
    res.render('pages/edit.html', {
      action: "/pages/" + req.params.id + "/edit",
      page: page
    });
  });
});

router.post('/:id/edit', function(req, res, next) {
  var data = {
    title: _.trim(req.body.title),
    content: req.body.content,
    updatedAt: new Date(),
  };

  if (req.body.slug) {
    data.slug = _.snakeCase(req.body.slug);
  }

  if (req.body.parentId && validator.isMongoId(req.body.parentId)) {
    data.parentId = req.body.parentId;
  }

  Page.update({_id: req.params.id}, {$set: data}, function(err, page) {
    if (err) return next(err);
    res.redirect('/pages/' + req.params.id);
  });
});

router.post('/:id/delete', checkChildren, function(req, res, next) {
  Page.remove({_id: req.params.id}, function(err, page) {
    if (err) return next(err);
    res.redirect('/pages');
  });
});

module.exports = router;
