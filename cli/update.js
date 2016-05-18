'use strict';
const log = require('npmlog');
module.exports.builder = (yargs) => {
    return yargs
        .strict()
        .usage('Usage: ./$0 update \n\nUpdates the /etc/hosts files with the containers ip addresses')
        .option('file', {
            type: 'string',
            alias: 'f',
            describe: 'docker-compose.yml file path'
        })
        .option('tld', {
            type: 'string',
            alias: 'd',
            default: 'dev',
            describe: 'Top level domain to append to containers names'
        })
        ;
};

module.exports.handler = (argv) => {
    process.title = 'Docker Hosts Updater';
    log.level = argv.logLevel || 'warn';
    var command = require('../lib/update.js');
    command.update(argv.file,argv.tld);
};