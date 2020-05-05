var mysql = require("mysql");
var config = require("../config"); //import dependencies

var pool = mysql.createPool(config.mysql); //create connection pool

var queries = { //list of mysql queries
    findUser: "SELECT users.id, users.username, users.email, users.password, UNIX_TIMESTAMP(users.created_at), users.confirmed FROM users WHERE users.username = ? OR users.email = ?",
    getUser: "SELECT users.id, users.username, users.email, users.password, UNIX_TIMESTAMP(users.created_at), users.confirmed FROM users WHERE users.id = ?",
    createUser: "INSERT INTO users (`username`, `email`, `password`) VALUES (?, ?, ?)",
    activateUser: "UPDATE users SET confirmed = 1 WHERE id = ?",
    getProjects: "SELECT id, title, module, DATE_FORMAT(end_date, '%M %D %Y') AS 'end_date', DATE_FORMAT(due_date, '%M %D %Y') AS 'due_date' FROM projects WHERE user_id = ?",
    createProject: "INSERT INTO projects (`user_id`, `title`, `module`, `end_date`, `due_date`) VALUES (?, ?, ?, ?, ?)",
    getProject: "SELECT id, title, module, DATE_FORMAT(end_date, '%Y-%m-%d') AS 'end_date', DATE_FORMAT(due_date, '%Y-%m-%d') AS 'due_date' FROM projects WHERE id = ? AND user_id = ?",
    editProject: "UPDATE projects SET title = ?, module = ?, end_date = ?, due_date = ? WHERE id = ? AND user_id = ?",
    deleteProject: "DELETE FROM projects WHERE id = ? AND user_id = ?",
    getMilestones: "SELECT id, project_id, title, description, completed_at FROM milestones WHERE project_id = ?",
    createMilestone: "INSERT INTO milestones (`project_id`, `title`, `description`) VALUES (?, ?, ?)",
    getMilestone: "SELECT milestones.id, milestones.project_id, milestones.title, milestones.description FROM milestones JOIN projects ON (milestones.project_id = projects.id) WHERE milestones.id = ? AND projects.user_id = ?",
    editMilestone: "UPDATE milestones JOIN projects ON (milestones.project_id = projects.id) SET milestones.title = ?, milestones.description = ? WHERE milestones.id = ? AND projects.user_id = ?",
    deleteMilestone: "DELETE FROM milestones WHERE milestones.id = ? AND (SELECT projects.user_id FROM projects WHERE projects.id = ?) = ?",
    completeMilestone: "UPDATE milestones JOIN projects ON (milestones.project_id = projects.id) SET completed_at = ? WHERE milestones.id = ? AND projects.user_id = ?"
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