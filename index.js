const Promise = require('bluebird'),
    _ = require('lodash'),
    YAML = require('yamljs');
const yargs = require('yargs');
const nothing = yargs
    .strict()
    .wrap(Math.min(120, yargs.terminalWidth()))
    .version().alias('version', 'v')
    .help('help').alias('help', 'h')
    .option('log-level', {
        type: 'string',
        default: 'warn',
        alias: 'll',
        describe: 'The log level to use (error, warn, info, verbose, etc.)',
        global: true,
    })
    .usage('docker host updater command line, choose one of the available commands.\n\nUsage: ./$0 <command> .. [options]')
    .demand(1, 'Please supply a valid command')
    .command('update', 'Updates /etc/hosts', require('./cli/update.js'))
    .argv;