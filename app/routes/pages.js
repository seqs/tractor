var express = require('express');
var _ = require('lodash');
var slug = require('limax');
var validator = require('validator');
var moment = require('moment');
var Page = require('../models/page');
var CommentModel = require('../models/comment');
var error = require('../helpers/error');
var Markdown = require('../helpers/markdown');
var Session = require('../helpers/session');
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

var getPager = function(req, res, next) {
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

var versionCount = function(req, res, next) {
  if (!req.page) {
    req.count = 0;
    return next();
  }

  req.page.versionModel().count({pageId: req.page._id}, function(err, count) {
    if (err) return next(err);
    req.count = count;
    next();
  });
};

var commentCount = function(req, res, next) {
  if (!req.page) {
    req.count = 0;
    return next();
  }

  CommentModel.count({pageId: req.page._id}, function(err, count) {
    if (err) return next(err);
    req.count = count;
    next();
  });
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

var getComment = function(req, res, next) {
  var query = {_id: req.params.commentId};
  CommentModel.findOne(query, function(err, comment) {
    if (err) return next(err);
    if (!comment) return next(error.raise('comment.commentId.notFound'));
    req.comment = comment;
    next();
  });
};

var getParent = function(req, res, next) {
  if (!req.page.parentId) {
    return next();
  }

  var query = {_id: req.page.parentId};
  Page.findOne(query, function(err, parent) {
    if (err) return next(err);
    req.parent = parent;
    next();
  });
};

var checkPage = function(req, res, next) {
  if (!req.page) {
    // return res.redirect('/pages/new?slug=' + (req.params.slug || "home"));
    return res.render('pages/not_found.html', {slug: (req.params.slug || "home")});
  }
  next();
};

var findChildren = function(req, res, next) {
  if (!req.page) {
    req.children = null;
    return next();
  }

  Page.find({parentId: req.page._id})
    .sort({createdAt: -1})
    .skip(req.pager.skip)
    .limit(req.pager.perPage)
    .populate('createdBy')
    .exec(function(err, pages) {
      if (err) return next(err);
      req.children = pages;
      next();
    });
};

var checkChildren = function(req, res, next) {
  Page.findOne({parentId: req.params.id}, function(err, page) {
    if (err) return next(err);
    if (page) return next(error.raise('page.id.relationExists'));
    next();
  });
};

var show = function(req, res, next) {
  var md = new Markdown();
  req.page.rendered = md.render(req.page.content || "");
  if (req.comments) {
    req.comments = _.map(req.comments, function(comment) {
      comment.rendered = md.marked(comment.content);
      return comment;
    });
  }
  req.page.hasPlugin = md.hasPlugin;
  res.render('pages/show.html', {
    user: req.user,
    page: req.page,
    parent: req.parent,
    children: req.children,
    comments: req.comments,
    pager: req.pager,
  });
};

var findVersions = function(req, res, next) {
  if (!req.page) {
    req.versions = null;
    return next();
  }

  req.page.versionModel().find({pageId: req.page._id})
    .sort({versionNo: -1})
    .skip(req.pager.skip)
    .limit(req.pager.perPage)
    .exec(function(err, versions) {
      if (err) return next(err);
      req.versions = versions;
      next();
    });
};

var findComments = function(req, res, next) {
  if (!req.page) {
    req.comments = null;
    return next();
  }

  CommentModel.find({pageId: req.page._id})
    .sort({createdAt: 1})
    .skip(req.pager.skip)
    .limit(req.pager.perPage)
    .populate('createdBy')
    .exec(function(err, comments) {
      if (err) return next(err);
      req.comments = comments;
      next();
    });
};


var getVersion = function(req, res, next) {
  var query = {_id: req.params.versionId, pageId: req.params.pageId};
  req.page.versionModel().findOne(query, function(err, version) {
    if (err) return next(err);
    req.version = version;
    next();
  });
};


router.get('/new', Session.authorize, function(req, res, next) {
  res.render('pages/new.html', {
    action: "/pages",
    page: {
      title: _.startCase(req.query.slug),
      slug: slug(req.query.slug || "", {tone: false}),
      content: "",
      parentId: req.query.parentId
    }
  });
});

router.get('/',
  Session.getCurrentUser,
  getPage,
  checkPage,
  childrenCount,
  getPager,
  findChildren,
  show
);

router.get('/:slug',
  Session.getCurrentUser,
  getPage,
  checkPage,
  getParent,
  childrenCount,
  getPager,
  findChildren,
  findComments,
  show
);

// if parentId was not mongoid, find by slug and reset with actual parentId
var processParentId = function(req, res, next) {
  if (req.body.parentId && !validator.isMongoId(req.body.parentId)) {
    var query = {slug: slug(req.body.parentId, {tone: false})};
    Page.findOne(query, function(err, parent) {
      if (err) return next(err);
      req.body.parentId = parent._id.toString();
      next();
    });
  } else {
    next();
  }
};

router.post('/',
  Session.authorize,
  processParentId,
  function(req, res, next) {
    var data = {
      title: _.trim(req.body.title || moment().format('MMMM Do YYYY, h:mm:ss a')),
      content: req.body.content,
      userId: req.user.id,
      createdAt: new Date(),
      createdIp: req.ip,
    };

    if (req.body.slug) {
      data.slug = slug(req.body.slug, {tone: false});
    }

    if (req.body.parentId && validator.isMongoId(req.body.parentId)) {
      data.parentId = req.body.parentId;
    }

    var page = new Page(data);
    page.save(function(err) {
      if (err) return next(err);
      res.redirect('/pages/' + page._id.toString());
    });
  }
);

router.get('/:slug/edit', Session.authorize, getPage, getParent, checkPage, function(req, res, next) {
  res.render('pages/edit.html', {
    action: "/pages/" + req.params.slug + "/edit",
    page: req.page,
    parent: req.parent
  });
});

router.post('/:slug/edit',
  Session.authorize,
  getPage,
  checkPage,
  processParentId,
  function(req, res, next) {
    req.page.setPrevious();
    req.page.title = _.trim(req.body.title);
    req.page.content = req.body.content;
    req.page.createdBy = req.page.createdBy;
    req.page.updatedBy = req.user.id;
    req.page.updatedAt = new Date();

    if (req.body.slug) {
      req.page.slug = slug(req.body.slug, {tone: false});
    }

    if (req.body.parentId && validator.isMongoId(req.body.parentId)) {
      req.page.parentId = req.body.parentId;
    }

    req.page.save(function(err) {
      if (err) return next(err);
      res.redirect('/pages/' + req.page._id);
    });
  }
);

router.post('/:id/delete', Session.authorize, getPage, checkPage, checkChildren, function(req, res, next) {
  req.page.remove(function(err) {
    if (err) return next(err);
    res.redirect('/pages');
  });
});

router.get('/:pageId/versions', Session.authorize, getPage, checkPage, versionCount, getPager, findVersions, function(req, res, next) {
  res.render('versions/index.html', {
    page: req.page,
    versions: req.versions
  });
});

router.get('/:pageId/versions/:versionId', Session.authorize, getPage, checkPage, getVersion, function(req, res, next) {
  if (!req.version) {
    return res.render('error.html', {message: "Version not found."});
  }
  res.render('versions/show.html', {
    page: req.page,
    version: req.version
  });
});



router.get('/:slug/comments',
  Session.getCurrentUser,
  getPage,
  checkPage,
  commentCount,
  getPager,
  findComments,
  function(req, res, next) {
    res.render('comments/index.html', {
      user: req.user,
      page: req.page,
      comments: req.comments
    });
  }
);

router.post('/:slug/comments',
  Session.authorize,
  getPage,
  checkPage,
  function(req, res, next) {
    var data = {
      pageId: req.page._id.toString(),
      content: req.body.content,
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    var comment = new CommentModel(data);
    comment.save(function(err) {
      if (err) return next(err);
      res.redirect('/pages/' + req.page._id.toString());
    });
  }
);

var checkCommentPermission = function(req, res, next) {
  if (req.user._id.toString() !== req.comment.createdBy.toString()) {
    return next(error.raise('comment.createdBy.invalid'));
  } else {
    next();
  }
};

router.get('/comments/:commentId/edit',
  Session.authorize,
  getComment,
  checkCommentPermission,
  function(req, res, next) {
    res.render('comments/edit.html', {
      action: "/pages/comments/" + req.params.commentId + "/edit",
      comment: req.comment,
    });
  }
);

router.post('/comments/:commentId/edit',
  Session.authorize,
  getComment,
  checkCommentPermission,
  function(req, res, next) {
    req.comment.createdBy = req.user.id;
    req.comment.content = req.body.content;
    req.comment.updatedAt = new Date();

    req.comment.save(function(err) {
      if (err) return next(err);
      res.redirect('/pages/' + req.comment.pageId);
    });
  }
);

router.post('/comments/:commentId/delete',
  Session.authorize,
  getComment,
  checkCommentPermission,
  function(req, res, next) {
    var pageId = req.comment.pageId;
    req.comment.remove(function(err) {
      if (err) return next(err);
      res.redirect('/pages/' + pageId);
    });
  }
);

module.exports = router;
