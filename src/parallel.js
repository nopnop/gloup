'use strict'
var bach = require('bach')
var tasksMaker = require('./tasksMaker')

module.exports = function (taskPath) {
  return function (tasks) {
    var runTasks = tasksMaker(taskPath, tasks)
    return bach.parallel.apply(null, runTasks)
  }
}
