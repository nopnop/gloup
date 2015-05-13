'use strict';
var bach = require('bach');
var tasksMaker = require('./tasksMaker');

module.exports = function (taskPath) {
  return function (tasks, argv) {
    var runTasks = tasksMaker(taskPath, tasks, argv);
    return bach.parallel.apply(null, runTasks);
  };
};