var express = require("express");
var mustache = require("mustache-express");
var config = require("./config");
var mysql = require("./models/mysql");
var auth = require("./models/auth");
var passport = require('passport');
var session = require("express-session"); //import dependencies

var app = express(); //init express app

app.engine("mustache", mustache());
app.set("view engine", "mustache"); //setup mustache
app.use(session({
    secret: config.session.secret,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", function(req, res) {
    res.status(200);
})

app.listen(config.app.port, () => { //make app listen for port
    console.log("Coursework scheduler listening on port " + config.app.port);
})