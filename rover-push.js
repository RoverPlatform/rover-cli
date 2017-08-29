#!/usr/bin/env node

const commander = require("commander")

let program = commander
    .command('test', 'send a manually constructed test push notification')
    .command('campaign', 'send a test push notification from an existing campaign')
    .parse(process.argv)
