#!/usr/bin/env node

const apn = require("apn")
const commander = require('commander')
const fs = require("fs")
const path = require("path")

const filePath = path.join(__dirname, "login.json")
const fileExists = fs.existsSync(filePath)

if (!fileExists) {
    console.log("not logged in")
    process.exit()
}

let program, provider, notification

Promise.resolve()
    .then(buildProgram)
    .then(validateOptions)
    .then(configureProvider)
    .then(buildNotification)
    .then(sendNotification)
    .then(validateResponse)
    .then(() => {
        console.info("Notification sent successfully!")
        process.exit(0)
    })
    .catch(err => {
        console.error(err)
        process.exit(1)
    })

function buildProgram() {
    program = commander
        .option("--certificate <file>", "Path to a valid APNS certificate")
        .option("--passphrase <string>", "APNS certificate passphrase - required unless passphrase is blank")
        .option("--bundle-id <string>", "The app's bundle identifier")
        .option("--device-token <string>", "The device's push token")
        .option("-D --development", "Use the development APNS environment")

        .option("--title <string>", "A short string describing the purpose of the notification")
        .option("--body <string>", "The text of the alert message", "Lorem ipsum sit dolor amet...")
        .option("--badge <integer>", "The number displayed in badge of your app icon")
        .option("--sound <string>", "The name of a sound file in your app's main bundle or in the Library/Sounds folder of your app's data container")
        .option("-C --content-available", "Set this flag to send a silent notification")
        .option("--category <string>", "A string value that represents the notification's type")
        .option("--thread-id <string>", "A string value that represents the app-specific identifier for grouping notifications")
        .option("-M --mutable-content", "Indicates this notification can be modified by a service extension")
        .parse(process.argv)
}

function validateOptions() {
    const requiredKeys = ["certificate", "bundleId", "deviceToken", "body"]
    for (let i = 0; i < requiredKeys.length; i++) {
        const key = requiredKeys[i]
        if (program[key] === undefined) {
            return Promise.reject(key + " is required")
        }
    }

    let fileExists = fs.existsSync(program.certificate)
    if (!fileExists) {
        return Promise.reject("Certificate at path " + program.certificate + " does not exist")
    }

    let fileExtension = path.extname(program.certificate)
    if (fileExtension !== ".p12") {
        return Promise.reject("Certificate at path " + program.certificate + " is not a valid p12 file")
    }

    return Promise.resolve()
}

function configureProvider() {
    provider = new apn.Provider({
      pfx: fs.readFileSync(program.certificate),
      production: program.development ? false : true,
      passphrase: program.passphrase
    })
}

function buildNotification() {
    if (program.contentAvailable) {
        notification = new apn.Notification({
            "aps": {
                "content-available": 1
            },
            "topic": program.bundleId,
            "priority": 10
        })
        return
    }

    notification = new apn.Notification({
        "aps": {
            "alert": {
                "title": program.title,
                "body": program.body
            },
            "badge": program.badge,
            "sound": program.sound,
            "category": program.category,
            "thread-id": program.threadId,
            "rover": {
                "notification": {
                    "id": "foo",
                    "campaignId": "bar",
                    "title": program.title,
                    "body": program.body,
                    "action": {
                        "__typename": "PresentExperienceAction",
                        "experienceId": "5873dee6d5bf3e002de4d70e"
                    },
                    "deliveredAt": "2017-11-22T13:01:48-05:00",
                    "expiresAt": "2017-12-24T00:00:00-05:00",
                    "isRead": false,
                    "isNotificationCenterEnabled": true
                }
            }
        },
        "topic": program.bundleId,
        "priority": 10
    })
}

function sendNotification() {
    return provider.send(notification, program.deviceToken)
}

function validateResponse(response) {
    if (response.failed.length >= 1) {
        const failed = response.failed[0]

        if (failed.error) {
            return Promise.reject(failed.error)
        }

        if (failed.response && failed.response.reason) {
            return Promise.reject(failed.response.reason)
        }

        return Promise.reject("Failed to send notification for an unknown reason")
    }

    return Promise.resolve()
}
