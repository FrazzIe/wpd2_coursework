var express = require("express");
var mustache = require("mustache-express");
var config = require("./config");
var mysql = require("./models/mysql");
var auth = require("./models/auth");
var mailer = require("./models/mailer");
var utils = require("./helpers/utils");
var passport = require("passport");
var session = require("express-session");
var bodyParser = require('body-parser');
var argon2 = require("argon2");
var jwt = require("jsonwebtoken"); //import dependencies

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
app.use(function(req, res, next) { //funcs to get url
    req.getUrl = function() {
        return req.protocol + "://" + req.get("host");
    }
    
    req.getFullUrl = function() {
        return req.protocol + "://" + req.get("host") + req.originalUrl;
    }

    return next();
}); //stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express

app.get("/", function(req, res) {
    res.status(200);
    if (req.isAuthenticated()) {
        res.render("home");
    } else {
        res.render("login");
    }
    
})

app.post("/login", passport.authenticate("local", { failureRedirect: "/" }), function(req, res) {
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
                    console.log(result)

                    jwt.sign({ //create a json web token with the account id inside
                        id: result.insertId,
                    }, config.mailer.secret, {
                        expiresIn: "1d"
                    }, function(err, token) {
                        console.log("token signed: ", token);
                        const url = req.getUrl() + "/verify/" + token
                        console.log(req.body.email, config.mailer.subject, config.mailer.body.format(req.body.username, url))
                        mailer.sendMail({
                            to: req.body.email,
                            subject: config.mailer.subject,
                            html: config.mailer.body.format(req.body.username, url)
                        });
                    });

                    res.send("ok");
                }).catch((error) => {
                    res.status(500).send(error.message);
                    console.log((error.message));
                });
            }).catch((error) => {
                res.status(500).send(error.message);
            });
        } else {
            res.send("user already exists");
        }
    }).catch((error) => {
        console.log((error.message));
        res.status(500).send(error.message);
    });
});

app.listen(config.app.port, () => { //make app listen for port
    console.log("Coursework scheduler listening on port " + config.app.port);
})

app.get("/verify/:token", function(req, res) {
    try {
        var user = jwt.verify(req.params.token, config.mailer.secret);

        console.log(user);

        mysql.query(mysql.queries.activateUser, [user.id]).then((result) => {
            console.log(result)

            res.send("ok");
        }).catch((error) => {
            res.status(500).send(error.message);
            console.log((error.message));
        });       
    } catch(e) {
        console.log(e.message);
    }
});