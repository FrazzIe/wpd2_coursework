var express = require("express");
var mustache = require("mustache-express");
var config = require("./config");
var mysql = require("./models/mysql"); //import dependencies
var app = express(); //init express app

app.engine("mustache", mustache());
app.set("view engine", "mustache"); //setup mustache

app.get("/", function(req, res) {
    res.status(200);
})

app.listen(config.app.port, () => { //make app listen for port
    console.log("Coursework scheduler listening on port " + config.app.port);
})