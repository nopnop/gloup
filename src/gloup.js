'use strict'

var minimist = require('minimist')
if (!~process.argv.slice(2).indexOf('--quiet')) {
  process.env.DEBUG = (process.env.DEBUG || '') + ' gloup gloup:*'
}

var globby = require('globby')
var basename = require('path').basename
var resolve = require('path').resolve
var makeSeries = require('./series')
var makeParallel = require('./parallel')
var dev = require('node-dev')
var path = require('path')

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
   * Retrieve task help
   * @param  {string} taskName Task name
   * @param  {boolean} short   Try to extract short help (first line)
   * @return {string}
   */
  function getTaskHelp (taskName, short) {
    var help
    try {
      help = require(path.join(tasksPath, taskName)).help()
      return short ? help.split('\n')[0] : help
    } catch (e) {
      return ''
    }
  }

  /**
   * Print usage message then exit
   */
  function usage () {
    let firstTask = process.argv[3]
    let taskHelp = firstTask ? getTaskHelp(firstTask) : null

    if (taskHelp) {
      taskHelp = taskHelp.split('\n').map(l => '    ' + l).join('\n')
      console.log(`    Usage: ${appName} [node options] ${firstTask} [options]\n\n${taskHelp}\n`)
    } else {
      let taskList = taskNames.map((task) => {
        let help = getTaskHelp(task, true)
        return '    - ' + task + (help ? '\n        ' + help : '')
      })
      .join('\n')

      let usage = options.usage || ''
      console.log(`
    Usage: ${appName} [node options] <tasks...> [options]

    Tasks are executed in series, options is shared with all tasks
    as a minimist argv

    Options:

      -h, --help [task] Show this message or the task's help
      --quiet           Disable verbose message (based on debug)

    Tasks:

${taskList}

${usage}
      `)
    }
    process.exit(0)
  }

  // Show usage if --help or no task are listed
  if (~process.argv.slice(2).indexOf('--help') || ~process.argv.slice(2).indexOf('-h') || !process.argv.slice(2).length) {
    let helpForTask = process.argv[3]
    usage(helpForTask)
  }

  var nodeDevIndex = args.indexOf('--executed-with-node-dev')

  if (!~nodeDevIndex) {
    let script = cliPath
    let firstTask
    let scriptArgs = []
    let nodeArgs = (options.flags || []).concat(process.execArgv)
    let opts = {} // node-dev options (not used yet)

    args.forEach(arg => {
      if (!firstTask) {
        if (!/^-/.test(arg)) {
          firstTask = arg
        }
        scriptArgs.push(arg)
      } else {
        scriptArgs.push(arg)
      }
    })

    scriptArgs.unshift('--executed-with-node-dev')
    dev(script, scriptArgs, nodeArgs, opts)
    return
  }

  var argv = minimist(process.argv.slice(2), {boolean: true})

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
