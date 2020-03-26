var express = require("express");
var mustache = require("mustache-express");
var config = require("./config");
var mysql = require("./models/mysql");
var auth = require("./models/auth");
var passport = require("passport");
var session = require("express-session"); //import dependencies

var app = express(); //init express app

app.engine("mustache", mustache( __dirname + "/views/partials"));
app.set("view engine", "mustache");
app.set("views", __dirname + "/views"); //setup mustache
app.use(session({
    secret: config.session.secret,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", function(req, res) {
    res.status(200);
    res.render("home");
})

app.get("/login", function(req, res) {
    res.render("");
});

app.post("/login", passport.authenticate("local", { failureRedirect: "/login" }), function(req, res) {
    res.redirect("/");
});
  
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.listen(config.app.port, () => { //make app listen for port
    console.log("Coursework scheduler listening on port " + config.app.port);
})