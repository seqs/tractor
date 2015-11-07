var express = require('express');
var router = express.Router();
var fs = require('fs');
var url = require('url');
var path = require('path');
var less = require('less');
var files = {};

router.get('/:file', function(req, res, next) {
  var root = __dirname + '/../styles';
  var pathname = url.parse(req.params.file).pathname;

  if (path.extname(pathname) != '.css') {
    return next();
  }

  if (files[pathname]) {
    res.set('Content-Type', 'text/css');
    return res.send(files[pathname]);
  }

  var src = path.join(
    root,
    path.dirname(pathname),
    path.basename(pathname, '.css') + '.less'
  );

  fs.readFile(src, function(err, data) {
    if (err) return next();
    var opts = {};
    opts.paths = [path.join(root, path.dirname(pathname)), __dirname + '/../../node_modules'];
    opts.filename = path.basename(src);

    less.render(new String(data), opts, function(err, output) {
      if (err) return next(err);
      files[pathname] = output.css;
      res.set('Content-Type', 'text/css');
      res.send(output.css);
    });
  });
});

module.exports = router;
