#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const filePath = path.join(__dirname, "login.json")
const fileExists = fs.existsSync(filePath)

if (!fileExists) {
    console.log("not logged in")
    process.exit()
}

fs.unlinkSync(filePath)
console.log("Local credentials cleared")
