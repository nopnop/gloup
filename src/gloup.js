'use strict'

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {boolean: true})
if (!argv.quiet) {
  process.env.DEBUG = (process.env.DEBUG || '') + ' gloup gloup:*'
}

var debug = require('debug')('gloup')
var globby = require('globby')
var basename = require('path').basename
var resolve = require('path').resolve
var makeSeries = require('./series')
var makeParallel = require('./parallel')
var dev = require('node-dev')

module.exports = gloup

/**
 * Run gloup task runner
 *
 * @param  {String} tasksPath
 *                  Path the folder that contain tasks
 *
 * @param  {Object} [options]
 *                  Gloup options:
 *                  - `name` {{String}}  Application name for the usage
 *                  - `usage` {{String}} Append this to the usage
 *                  - `flags` {{Array}}  List of flags to add when using node-dev
 *                    (for instance: --es_staging)
 */
function gloup (tasksPath, options) {
  options = options || {}
  tasksPath = resolve(tasksPath)

  var cliPath = process.argv[1]
  var appName = options.name || basename(cliPath)
  var args = process.argv.slice(2)

  // Run gloup
  var taskNames = globby.sync(tasksPath + '/*.js')
    .map(function (file) { return basename(file, '.js') })

  /**
   * Print usage message then exit
   */
  function usage () {
    let taskList = taskNames.map(task => '    - ' + task).join('\n')
    let usage = options.usage || ''
    console.log(`
    Usage: ${appName} [node options] <tasks...> [options]

    Tasks are executed in series, options is shared with all tasks
    as a minimist argv

    Options:

      -h, --help        Show this message
      --quiet           Disable verbose message (based on debug)

    Tasks:

${taskList}

${usage}
    `)
    process.exit(0)
  }

  // Show usage if --help or no task are listed
  if (argv.help || argv.h || !argv._.length) {
    usage()
  }

  var nodeDevIndex = args.indexOf('--executed-with-node-dev')
  if (!~nodeDevIndex) {
    let devArgs = (options.flags || [])
    let flagCli = false
    args.forEach(arg => {
      if (!/^-/.test(arg) && !flagCli) {
        devArgs.push(cliPath)
        flagCli = true
      }
      devArgs.push(arg)
    })
    devArgs.push('--executed-with-node-dev')
    // debug('execute','node-dev ' + devArgs.join(' '))
    dev(devArgs)
    return
  }

  delete argv['executed-with-node-dev']

  var fnSeries = makeSeries(tasksPath)(argv._, argv)

  fnSeries((err, res) => {
    if (err) {
      throw err
    }
  })
}

gloup.series = makeSeries
gloup.parallel = makeParallel
