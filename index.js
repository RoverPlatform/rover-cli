#!/usr/bin/env node

const commander = require("commander")
const pkg = require("./package.json")

let program = commander
    .version(pkg.version)
    .command("whoami", "display the current logged in user")
    .command("login", "login with your Rover credentials")
    .command("logout", "clears local login credentials")
    .command("push", "send a push notification")
    .parse(process.argv)
