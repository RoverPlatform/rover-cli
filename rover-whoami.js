#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const filePath = path.join(__dirname, "login.json")
const fileExists = fs.existsSync(filePath)

if (!fileExists) {
    console.log("not logged in")
    process.exit()
}

const data = fs.readFileSync(filePath, { encoding: "utf-8" })
const login = JSON.parse(data)

console.log(login.user.name + " <" + login.user.email + ">")
