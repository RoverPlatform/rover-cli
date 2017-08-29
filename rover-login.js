#!/usr/bin/env node

(function login() {
    const inquirer = require("inquirer")
    const request = require("request")
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
        .then(() => {
            console.log("Successfully signed in as " + self.user.name + " (" + self.account.title + ")")
        })
        .catch((err) => {
            console.log("Invalid email or password")
            login()
        })

    function inquire() {
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
                        name: data.attributes.name
                    }
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        })
    }
})()
