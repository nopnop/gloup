'use strict'

var Promise = require('bluebird')
var bach = require('bach')
var debug = require('debug')('gloup')
var resolve = require('path').resolve
var asyncDone = require('async-done')
var ms = require('ms')

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
 * @return {Array}  Array of functions
 */
module.exports = function (taskPath, tasks) {
  return tasks.map(task => {
    let run
    let taskName

    if (typeof (task) === 'function') {
      run = task
      taskName = run.name || 'anonymous'
    } else {
      taskName = task
      try {
        run = require(resolve(taskPath, taskName))
      } catch (e) {
        console.error('Task not found (or parse error, see trace below): ', taskName)
        console.error('')
        console.error(e.stack)
        process.exit(1)
      }
    }

    return function () {
      return new Promise((resolve, reject) => {
        var startTime
        var fn = bach.series(
          function () {
            startTime = Date.now()
            debug('⇢ %s', taskName)
            return Promise.resolve()
          },
          function (callback) {
            return new Promise(function (resolve, reject) {
              asyncDone(run, function (err, result) {
                if (err) {
                  console.error(err.stack)
                  reject(err)
                } else {
                  resolve(result)
                }
              })
            })
          },
          function () {
            var duration = Date.now() - startTime
            debug('⇠ %s (%s)', taskName, ms(duration))
            return Promise.resolve()
          }
        )

        fn((err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        })
      })
    }
  })
}
