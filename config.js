const dotenv = require('dotenv').config();

if (dotenv.error) {
    throw dotenv.error
}

const config = {
    app: {
        port: process.env.PORT || 3000,
    },
    mysql: {
        connectionLimit: 10,
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DB,
    },
    session: {
        secret: process.env.SESSION_SECRET,
    },
    mailer: {
        secret: process.env.EMAIL_SECRET,
        service: process.env.EMAIL_SERVICE,
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS,
        subject: "Coursework Planner - Email confirmation", //email confirmation subject
        body: `
            Hi {0},
            <br>
            <br>
            Thank you for joining Coursework Planner,
            <br>
            Please click the link to confirm your email: <a href="{1}">{1}</a>
        `, //email confirmation body, {0} for the username, {1} for the confirmation url
    }
}

module.exports = config;