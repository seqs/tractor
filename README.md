# Tractor

Tractor, the missing wiki platform for Hackers.

![logo](https://raw.githubusercontent.com/seqs/tractor/master/public/assets/images/logo.png)

![snap](https://raw.githubusercontent.com/seqs/tractor/master/public/assets/images/snap-1.png)

![snap](https://raw.githubusercontent.com/seqs/tractor/master/public/assets/images/snap-2.png)

![snap](https://raw.githubusercontent.com/seqs/tractor/master/public/assets/images/snap-3.png)

## Introduction

Tractor is a flexible, powerful, secure, yet simple web-based wiki platform, it is written in Node.js that is easy to install, hack, and maintain.

Tractor comes bundled with its own webserver (which, by default, listens on port 1337), so you should be up-and-running in minutes.

Of course, there are always TODO that can be made. That's where (I hope) you come in ...

## Features

* It is based on [Express](http://expressjs.com/), [Mongoose](http://mongoosejs.com/), [Swig](http://paularmstrong.github.io/swig/) and they are being actively developed.
* In particular, this wiki is compatible with Node 0.12.6 and 4.0.0.
* It uses [Marked](https://github.com/chjj/marked) as its Markdown engine and support [GitHub flavored markdown](https://help.github.com/articles/github-flavored-markdown).
* Tractor uses [Mermaid](http://knsv.github.io/mermaid/) for diagrams and flowcharts.
* It uses [KaTeX](https://khan.github.io/KaTeX/) for a real, functional, LaTeX view, which produces a TeXable output (equations and all) from your Markdown+itex source.
* TODO: Enhanced administrative features, for easier management of Wiki pages and uploaded files.
* TODO: Support for the HTML5 `<audio>` and `<video>` elements.
* TODO: Support for embedding File Uploads.
* TODO: Redis-based caching, full support for `Etag`s and Conditional `GET`s, for more efficient use of bandwidth.


## Install

```
git clone https://github.com/seqs/tractor.git
cd tractor
npm install
npm install bower -g
bower install
npm start
```

Open your browser: http://localhost:1337/


## Editing

### To link to another Tractor wiki page, use the Tractor Page Link Tag.

```
[[Tractor Works]]
```

The above tag will create a link to the corresponding page file named `tractor-works`. The conversion uses [limax](https://github.com/lovell/limax):

* Latin: e.g. `i ♥ latin` to `i-love-latin`
* Cyrillic: e.g. `Я люблю русский` to `ya-lyublyu-russkij`
* Chinese: e.g. `我爱官话` to `wo-ai-guan-hua`
* Japanese: e.g. `私は ひらがな が大好き` to `ha-hiragana-gaki`

If you'd like the link text to be something that doesn't map directly to the page name, you can specify the actual page name after a pipe:

```
[[How Tractor works|Tractor Works]]
```

The above tag will link to `tractor-works` using "How Tractor Works" as the link text.

### Mermaid charts

```
@@@
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
@@@
```

### KaTeX math typesetting

```
^^^
f(x) = \int_{-\infty}^\infty
\hat f(\xi)\,e^{2 \pi i \xi x}
\,d\xi
^^^
```

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code to be distributed under the MIT license. You are also implicitly verifying that all code is your original work.


## License

Copyright (c) 2015, Seqs. (MIT License)

See LICENSE for more info.

