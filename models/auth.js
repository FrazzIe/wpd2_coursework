var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var mysql = require("./mysql");
var argon2 = require("argon2"); //import dependencies

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(function(username, password, cb) {
    mysql.query(mysql.queries.findUser, [username, username]).then((result) => { //find user
        if (typeof result[0] !== "undefined") { //found user
            argon2.verify(result[0].password, password).then((matches) => {
                if (matches) { //password matches
                    cb(null, result[0]);
                    console.log("successful login");
                } else { //doesn't match
                    console.log("password does not match");
                    cb(null, false);
                }
            }).catch((error) => {
                cb(error);
            })
        } else { //not found user
            cb(null, false);
        }
    }).catch((error) => {
        cb(error);
    });
}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    mysql.query(mysql.queries.getUser, [id]).then((result) => { //find user
        if (typeof result[0] !== "undefined") { //found user
            cb(null, result[0]);
        } else { //not found user
            cb(null, false);
        }
    }).catch((error) => {
        cb(error);
    });
});