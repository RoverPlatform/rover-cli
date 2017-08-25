#!/usr/bin/env node

var apn = require("apn")
var args = require("args")
var fs = require("fs")
var path = require("path")

let flags, provider, notification

Promise.resolve()
    .then(captureTheFlags)
    .then(validateFlags)
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

function captureTheFlags() {
    args
      .option("certificate", "Path to a valid APNS certificate")
      .option("passphrase", "APNS certificate passphrase - required unless passphrase is blank")
      .option("bundle-id", "The app's bundle identifier")
      .option("device-token", "The device's push token")
      .option("development", "Use the development APNS environment")

      .option("title", "A short string describing the purpose of the notification")
      .option("body", "The text of the alert message", "Lorem ipsum sit dolor amet...")
      .option("badge", "The number displayed in badge of your app icon")
      .option("sound", "The name of a sound file in your app's main bundle or in the Library/Sounds folder of your app's data container")
      .option("content-available", "Set this flag to send a silent notification")
      .option("category", "A string value that represents the notification's type")
      .option("thread-id", "A string value that represents the app-specific identifier for grouping notifications")
      .option("mutable-content", "Indicates this notification can be modified by a service extension")

    flags = args.parse(process.argv)
}

function validateFlags() {
    const requiredKeys = ["certificate", "bundleId", "deviceToken", "body"]
    for (let i = 0; i < requiredKeys.length; i++) {
        const key = requiredKeys[i]
        if (flags[key] === undefined) {
            return Promise.reject(key + " is required")
        }
    }

    let fileExists = fs.existsSync(flags.certificate)
    if (!fileExists) {
        return Promise.reject("Certificate at path " + flags.certificate + " does not exist")
    }

    let fileExtension = path.extname(flags.certificate)
    if (fileExtension !== ".p12") {
        return Promise.reject("Certificate at path " + flags.certificate + " is not a valid p12 file")
    }

    return Promise.resolve()
}

function configureProvider() {
    provider = new apn.Provider({
      pfx: fs.readFileSync(flags.certificate),
      production: flags.development ? false : true,
      passphrase: flags.passphrase
    })
}

function buildNotification() {
    notification = new apn.Notification({
        "aps": {
            "alert": {
                "title": flags.title,
                "body": flags.body
            },
            "badge": flags.badge,
            "sound": flags.sound,
            "content-available": flags.contentAvailable,
            "category": flags.category,
            "thread-id": flags.threadId,
            "rover": {
                "foo": "bar"
            }
        },
        "topic": flags.bundleId,
        "priority": 10
    })
}

function sendNotification() {
    return provider.send(notification, flags.deviceToken)
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
