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
    }
}

module.exports = config;