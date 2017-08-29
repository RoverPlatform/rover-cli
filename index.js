#!/usr/bin/env node

const commander = require("commander")
const pkg = require("./package.json")

let program = commander
    .version(pkg.version)
    .command('push', 'send a push notification')
    .command('login', 'sign in to your Rover account')
    .parse(process.argv)
