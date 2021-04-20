const express = require("express");
const session = require('express-session')
const Driver = require('../config/db')
const {
    check,
    validationResult
} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();
mongoDriver = new Driver();

mongoDriver.connect();

const request = require("request")

/**
* @method - POST
* @param - /signup
* @description - User SignUp
*/
router.post(
    "/signup",
    [
        check("username", "Please Enter a Valid Username")
        .not()
        .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("./login-signup.html", {
                errors: errors.array().map((err) => {
                    return err.msg;
                }),
                errorSignup: true
            });
        }
        const {
            username,
            email,
            password
        } = req.body;
        try {
            let users = await mongoDriver.find({'email' : email})
            let count = await users.count();
            if (count > 0) {
                return res.status(400).render("./login-signup.html", {
                    errors: ["User Already Exists"],
                    errorSignup: true
                });
            }
            
            const salt = await bcrypt.genSalt(10);
            let user = { username: username, password: '', email: email}
            user.password = await bcrypt.hash(password, salt);
            
            let result = await mongoDriver.insertDocument(user)
            const payload = {
                user: {
                    id: email
                }
            };
            jwt.sign(
                payload,
                "secret", {
                    expiresIn: 3600
                },
                (err, token) => {
                    if (err) throw err;
                    res.cookie("Authorization", token)
                    res.cookie("Email", email)
                    setTimeout(() => {
                        res.redirect("/")                            
                    }, 3000);
                }
                );
            } catch (err) {
                console.log(err.message);
                res.status(500).send("Error in Saving");
            }
        }
        );
        router.post(
            "/login",
            [
                check("email", "Please enter a valid email").isEmail(),
                check("password", "Please enter a valid password").isLength({
                    min: 6
                })
            ],
            async (req, res) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).render("./login-signup.html", {
                        errors: errors.array().map((err) => {
                            return err.msg;
                        })
                    });
                }
                const {
                    email,
                    password
                } = req.body;
                try {
                    // const query = datastore.createQuery('User').filter("email", "=", email);
                    
                    // const [users] = await datastore.runQuery(query);
                    let users = await mongoDriver.find({'email' : email})
                    let count = await users.count()
                    if (count == 0) {
                        return res.status(400).render("./login-signup.html", {
                            errors: ["User does not exist"]
                        });
                    }
                    let user = await users.next()
                    
                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch)
                    return res.status(400).render("./login-signup.html", {
                        errors: ["Incorrect Password"]
                    });
                    const payload = {
                        user: {
                            id: email
                        }
                    };
                    jwt.sign(
                        payload,
                        "secret", {
                            expiresIn: 3600
                        },
                        (err, token) => {
                            if (err) throw err;
                            res.cookie("Authorization", token)
                            res.cookie("Email", email)
                            res.redirect("/")
                        }
                        );
                    } catch (e) {
                        console.error(e);
                        res.status(500).json({
                            message: "Server Error"
                        });
                    }
                }
                );
                
                module.exports = router
                