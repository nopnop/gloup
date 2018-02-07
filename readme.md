# gloup
[![NPM version](https://badge-me.herokuapp.com/api/npm/gloup.png)](http://badges.enytc.com/for/npm/gloup)

Another mini task runner based on bach

## Deprecated

**This project is no longer maintained**.

## Features

  - One task = one file = one function
  - Task on the command line are executed in series
  - Compose task in parallel or in series (based on [bach](https://www.npmjs.com/package/bach))
  - Supports node's (or iojs) flags on the command line

This tool as been drafted for some specific needs: use it if you like, enhance it if you don't. Else [gulp](http://gulpjs.com/) is a better fit for you.

## Installation

```shell
npm install --save gloup
```

## Usage

With the folder structure below:

```shell
├─ myapp
└─ tasks
   ├─ bundle.js
   ├─ clean.js
   ├─ dev.js
   ├─ dist.js
   ├─ statics.js
   └─ serve.js
```

**myapp**:
The executable main script (`chmod +x myapp`)
```javascript
#!/usr/bin/env node
var gloup = require('gloup')
gloup(__dirname + '/tasks')
```

**tasks/clean.js**:
A task must export a function that return anything [async-done](https://www.npmjs.com/package/async-done) supports (stream, promise, etc.)
```javascript
var del = require('promised-del')
var resolve = require('path').resolve

module.exports = function () {
  return del(['build'], {
    cwd: resolve(__dirname, '../../')
  })
}
```

**tasks/dist.js**:
You can compose tasks using tasks name (based on filename) or function

```javascript
var series = require('gloup').series(__dirname)
var parallel = require('gloup').parallel(__dirname)

module.exports = series([
  'clean',
  parallel('bundle','statics'),
  function () {
    return new Promise(function (resolve, reject) {
      // ...
    })
  }
])
```

**Now, `myapp` can be used as a task runner**

```shell
> myapp clean bundle serve
  gloup ⇢ clean +0ms
  gloup ⇠ clean +0ms
  gloup ⇢ bundle +1s
  gloup ⇠ bundle +6s
  gloup ⇢ serve +0ms
  gloup ⇠ serve +2ms
```

**Start a composed task**
```shell
> myapp dist
  gloup ⇢ clean +0ms
  gloup ⇠ clean +0ms
  gloup ⇢ bundle +1s
  gloup ⇢ statics +1s
  gloup ⇠ bundle +6s
  gloup ⇠ statics +6s
  gloup ⇢ serve +0ms
  gloup ⇠ serve +2ms
```

**With node options:**
```shell
> myapp --debug --es_staging serve
Debugger listening on port 5858
  gloup ⇢ serve +0ms
  gloup ⇠ serve +2ms
```

**Quiet mode (remove gloup messages):**
```shell
> myapp serve --quiet
```

## api

Create a command line tool
```javascript
#!/usr/bin/env node
var gloup = require('gloup')

// Path to the tasks folder
gloup(__dirname + '/tasks')

// Force node (iojs) flags
gloup(__dirname + '/tasks', {
  flags: ['--es_staging']
})
```

Use `series` and `parallel` composer (just a convenient wrapper around [bach](https://www.npmjs.com/package/bach)) to compose tasks with name.

```javascript
// gloup.series(taskFolder) -> {function} :
var series = require('gloup').series(__dirname)
// gloup.parallel(taskFolder) -> {function} :
var parallel = require('gloup').parallel(__dirname)
module.exports = series(['clean', parallel('bundle','statics')])
```
---

[The MIT License](./LICENSE)
