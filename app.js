var express = require("express");
var mustache = require("mustache-express"); //import dependencies
var app = express(); //init express app

app.engine("mustache", mustache());
app.set("view engine", "mustache"); //setup mustache
app.set("port", process.env.PORT || 3000) //set port

app.get("/", function(req, res) {
    res.status(200);
})

app.listen(app.get("port"), () => { //make app listen for port
    console.log("Coursework scheduler listening on port " + app.get("port"));
})