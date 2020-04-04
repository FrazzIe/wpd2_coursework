var config = require("./../config");
var nodemailer = require("nodemailer");

console.log(config.mailer.service, config.mailer.user, config.mailer.password);
var transporter = nodemailer.createTransport({
    service: config.mailer.service,
    auth: {
        user: config.mailer.user,
        pass: config.mailer.password
    }
});

module.exports = transporter;