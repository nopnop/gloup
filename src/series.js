'use strict'
var bach = require('bach')
var tasksMaker = require('./tasksMaker')
var asyncDone = require('async-done')

module.exports = function (taskPath) {
  return function (tasks) {
    var runTasks = tasksMaker(taskPath, tasks)
    return bach.series.apply(null, runTasks)
  }
}
