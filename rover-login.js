#!/usr/bin/env node

(function login() {
    const self = this

    self.email = null
    self.password = null
    self.session = null
    self.account = null
    self.user = null

    Promise.resolve()
        .then(inquire)
        .then(createSession)
        .then(fetchAccount)
        .then(fetchUser)
        .then(writeToFile)
        .then(() => {
            console.log("Logged in as " + self.user.name + " <" + self.user.email + ">")
        })
        .catch((err) => {
            login()
        })

    function inquire() {
        const inquirer = require("inquirer")

        console.log("Enter your Rover crednetials.")

        const questions = [{
            name: "email",
            message: "Email:"
        }, {
            type: "password",
            name: "password",
            message: "Password:"
        }]

        return inquirer.prompt(questions).then(answers => {
            self.email = answers.email
            self.password = answers.password
        })
    }

    function createSession() {
        const request = require("request")

        return new Promise((resolve, reject) => {
            const { email, password } = self
            const body = JSON.stringify({
                data: {
                    attributes: {
                        email,
                        password
                    },
                    type: "sessions"
                }
            })

            const options = {
                body,
                headers: {
                    "accept": "application/vnd.api+json",
                    "content-type": "application/vnd.api+json"
                },
                method: "POST",
                url: "https://api.rover.io/v1/sessions"
            }

            request(options, function (error, response, body) {
                if (error) {
                    return reject(error)
                }

                if (response.statusCode != 200) {
                    const error = new Error("Failed to create session")
                    error.code = response.statusCode
                    return reject(error)
                }

                const json = JSON.parse(body)
                try {
                    const data = json.data
                    const relationships = data.relationships
                    self.session = {
                        id: data.id,
                        token: data.attributes.token,
                        userId: relationships.user.data.id,
                        accountId: relationships.account.data.id
                    }
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        })
    }

    function fetchAccount() {
        const request = require("request")

        return new Promise((resolve, reject) => {
            const { token, accountId } = self.session
            const options = {
                headers: {
                    "accept": "application/vnd.api+json",
                    "authorization": "Bearer " + token
                },
                method: "GET",
                url: "https://api.rover.io/v1/accounts/" + accountId
            }

            request(options, function (error, response, body) {
                if (error) {
                    return reject(error)
                }

                if (response.statusCode != 200) {
                    const error = new Error("Failed to fetch account")
                    error.code = response.statusCode
                    return reject(error)
                }

                const json = JSON.parse(body)
                try {
                    const data = json.data
                    self.account = {
                        id: data.id,
                        title: data.attributes.title
                    }
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        })
    }

    function fetchUser() {
        const request = require("request")

        return new Promise((resolve, reject) => {
            const { token, userId } = self.session
            const options = {
                headers: {
                    "accept": "application/vnd.api+json",
                    "authorization": "Bearer " + token
                },
                method: "GET",
                url: "https://api.rover.io/v1/users/" + userId
            }

            request(options, function (error, response, body) {
                if (error) {
                    return reject(error)
                }

                if (response.statusCode != 200) {
                    const error = new Error("Failed to fetch user")
                    error.code = response.statusCode
                    return reject(error)
                }

                const json = JSON.parse(body)
                try {
                    const data = json.data
                    self.user = {
                        id: data.id,
                        name: data.attributes.name,
                        email: data.attributes.email
                    }
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        })
    }

    function writeToFile() {
        const fs = require("fs")
        const path = require("path")

        const data = JSON.stringify({
            session: self.session,
            account: self.account,
            user: self.user
        })

        const file = path.join(__dirname, 'login.json')
        fs.writeFileSync(file, data)
        return Promise.resolve()
    }
})()
