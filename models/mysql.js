var mysql = require("mysql");
var config = require("../config"); //import dependencies

var pool = mysql.createPool(config.mysql); //create connection pool

var queries = { //list of mysql queries
    findUser: "SELECT users.id, users.username, users.email, users.password, UNIX_TIMESTAMP(users.created_at), users.confirmed FROM users WHERE users.username = ? OR users.email = ?",
    getUser: "SELECT users.id, users.username, users.email, users.password, UNIX_TIMESTAMP(users.created_at), users.confirmed FROM users WHERE users.id = ?",
    createUser: "INSERT INTO users (`username`, `email`, `password`) VALUES (?, ?, ?)",
    activeUser: "UPDATE users SET confirmed = 1 WHERE id = ?",
}

function execute(sql, params) { //Asynchronous sql execute function
    return new Promise((resolve, reject) => { //create a new promise
        pool.query(sql, params, (error, result, fields) => { //query the server
         if (error) reject(error); //if error then display error
            resolve(result); //return result
        });
    });
};

execute("SELECT VERSION()", {}).then((result) => { //Check if connection was successful
    console.log("Database: connection established!");
}).catch((error) => {
    console.log("Database: " + error.message);
});

module.exports = {
    queries: queries,
    query: execute
};