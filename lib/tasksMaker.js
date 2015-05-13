'use strict';

var Promise = require('bluebird');
var bach = require('bach');
var debug = require('debug')('gloup');
var resolve = require('path').resolve;

/**
 * Create a decorated task array
 *
 * @param  {String} taskPath
 *                  Absolute path (or relative to cwd) to the folder
 *                  containing the available tasks
 *
 * @param  {Array} tasks
 *                 Array of task function or task name
 *
 * @param  {Object} [argv]
 *                  Optional option object to pass to tasks
 *
 * @return {Array}  Array of functions
 */
module.exports = function (taskPath, tasks, argv) {
  argv = argv || {};

  return tasks.map(function (task) {
    var run = undefined;
    var taskName = undefined;

    if (typeof task === 'function') {
      run = task;
      taskName = run.name || 'anonymous';
    } else {
      taskName = task;
      try {
        run = require(resolve(taskPath, taskName));
      } catch (e) {
        console.error('Task not found (or parse error, see trace below): ', taskName);
        console.error('');
        console.error(e.stack);
        process.exit(1);
      }
    }

    return function () {
      return new Promise(function (resolve, reject) {
        var fn = bach.series(function () {
          debug('⇢ %s', taskName);
          return Promise.resolve();
        }, function () {
          return run(argv);
        }, function () {
          debug('⇠ %s', taskName);
          return Promise.resolve();
        });

        fn(function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    };
  });
};