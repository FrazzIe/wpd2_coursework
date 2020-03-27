var express = require("express");
var mustache = require("mustache-express");
var config = require("./config");
var mysql = require("./models/mysql");
var auth = require("./models/auth");
var passport = require("passport");
var session = require("express-session");
var bodyParser = require('body-parser');
var argon2 = require("argon2"); //import dependencies

var app = express(); //init express app

app.engine("mustache", mustache(__dirname + "/public/views/partials"));
app.set("view engine", "mustache");
app.set("views", __dirname + "/public/views"); //setup mustache
app.use(session({
    secret: config.session.secret,
})); //setup session
app.use(passport.initialize());
app.use(passport.session()); //setup passport session
app.use(express.static(__dirname + "/public")); //serve static files
app.use(bodyParser.json()); //parse json requests

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

app.post("/register", function(req, res) {
    console.log(req.body);

    mysql.query(mysql.queries.findUser, [req.body.username, req.body.email]).then((result) => {
        if (typeof result[0] === "undefined") {
            argon2.hash(req.body.password).then((hashedPassword) => {
                mysql.query(mysql.queries.createUser, [req.body.username, req.body.email, hashedPassword]).then((result) => {
                    res.send("ok");
                }).catch((error) => {
                    res.status(500).send(error.message);
                    console.log((error.message));
                });
            }).catch((error) => {
                res.status(500).send(error.message);
            });
        } else {
            res.send("exists");
        }
    }).catch((error) => {
        console.log((error.message));
        res.status(500).send(error.message);
    });
});

app.listen(config.app.port, () => { //make app listen for port
    console.log("Coursework scheduler listening on port " + config.app.port);
})