var config = require("./../config");
var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
    service: config.mailer.service,
    auth: {
        user: config.mailer.user,
        pass: config.mailer.password
    }
});

module.exports = transporter;