const dotenv = require('dotenv').config();

if (dotenv.error) {
    throw dotenv.error
}

const config = {
    app: {
        port: process.env.PORT || 3000,
    }
}

module.exports = config;