var Marked = require('marked');
var highlight = require('highlight.js');
var crypto = require("crypto");
var slug = require('limax');

var mdRenderer = new Marked.Renderer();

Marked.setOptions({
  gfm: true,
  renderer: mdRenderer,
  // pedantic: this is set on the render method
  tables: true,
  breaks: false,
  smartLists: true,
  sanitize: false, // To be able to add iframes
  highlight: function(code, lang) {
    return highlight.highlightAuto(code).value;
  }
});

function Renderer() {
  this.tagmap = {};
  this.stashmap = {};
  this.hasMermaid = false;
  this.hasKatex = false;
}

Renderer.prototype.stashFencesTags = function (text) {
  var self = this;
  var matches = text.match(/^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/gm);

  if (matches) {
    matches.forEach(function(match) {
      match = match.trim();
      var tag = /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/.exec(match);
      if (!tag[3]) {
        return;
      }

      var id = crypto.createHash('sha1').update(tag[0]).digest("hex");
      self.stashmap[id] = tag[0];
      text = text.replace(tag[0], id);
    });
  }
  return text;
}

// Yields the content with the rendered [[bracket tags]]
// The rules are the same for Gollum https://github.com/github/gollum
Renderer.prototype.extractBracketTags = function (text) {
  var self = this;
  var matches = text.match(/(.?)\[\[(.+?)\]\]([^\[]?)/g);

  if (matches) {
    matches.forEach(function(match) {
      match = match.trim();
      var tag = /(.?)\[\[(.+?)\]\](.?)/.exec(match);
      if (tag[1] == "'") {
        return;
      }

      // convert to html
      var name, pageName;
      var parts = tag[2].split("|");
      name = pageName = parts[0];
      if (parts[1]) {
        pageName = parts[1];
      }
      pageName = encodeURIComponent(slug(pageName, {tone: false}));
      var html = "<a class=\"internal\" href=\"/pages/" + pageName + "\">" + name + "</a>";

      var id = crypto.createHash('sha1').update(tag[2]).digest("hex");
      self.tagmap[id] = html;
      text = text.replace(tag[0], id);
    });
  }
  return text;
}

Renderer.prototype.extractMermaidTags = function (text) {
  var self = this;
  var matches = text.match(/^ *(@{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/gm);

  if (matches) {
    matches.forEach(function(match) {
      match = match.trim();
      var tag = /^ *(@{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/.exec(match);
      if (!tag[3]) {
        return;
      }

      // to html
      var html = "<div class=\"mermaid\">" + tag[3] + "</div>";

      var id = crypto.createHash('sha1').update(tag[0]).digest("hex");
      self.tagmap[id] = html;
      text = text.replace(tag[0], id);
      self.hasMermaid = true;
    });
  }
  return text;
}


Renderer.prototype.extractKatexTags = function (text) {
  var self = this;
  var matches = text.match(/^ *(\^{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/gm);

  if (matches) {
    matches.forEach(function(match) {
      match = match.trim();
      var tag = /^ *(\^{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/.exec(match);
      if (!tag[3]) {
        return;
      }

      // to html
      var html = "<div class=\"tex\" data-expr=\"\\displaystyle{" + tag[3].replace(/\n/g, ' ') + "}\"></div>";

      var id = crypto.createHash('sha1').update(tag[0]).digest("hex");
      self.tagmap[id] = html;
      text = text.replace(tag[0], id);
      self.hasKatex = true;
    });
  }
  return text;
}

Renderer.prototype.evalTags = function (text) {
  var re;
  for (var k in this.tagmap) {
    re = new RegExp(k, "g");
    text = text.replace(re, this.tagmap[k]);
  }
  return text;
}

Renderer.prototype.extractStashes = function (text) {
  var re;
  for (var k in this.stashmap) {
    re = new RegExp(k, "g");
    text = text.replace(re, this.stashmap[k]);
    // "abac".replace(/a/g, "$$$");
  }
  return text;
}

Renderer.prototype.render = function(content) {
  content = content
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  content = this.stashFencesTags(content);
  content = this.extractBracketTags(content);
  content = this.extractMermaidTags(content);
  content = this.extractKatexTags(content);
  content = this.extractStashes(content);
  content = Marked(content);
  return this.evalTags(content);
};

module.exports = Renderer;
