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
		res.render("home", {
			username: req.user.username,
			email: req.user.email
		});
	} else {
		res.render("login");
	}
})

app.post("/login", (req, res, next) => {   //When /login is requested by a user
	passport.authenticate("local", (err, user, info) => { // models/auth.js -> use strategy to validate user login credentials
		if (err) { //if there is an error then
			return next(err);
		}

		if (!user) { //if the profile does not exist then
			return res.send(info.message); //refuse login
		}

		req.login(user, function(err) { //login user
			if (err) { 
				return next(err);
			}

			return res.send("ok");
		});
	})(req, res, next);
});
  
app.get("/logout", function(req, res) {
	req.logout();
	res.redirect("/");
});

app.post("/register", function(req, res) {
	console.log(req.body);

	mysql.query(mysql.queries.findUser, [req.body.username, req.body.email]).then((result) => { //finds any rows with the username or email
		if (typeof result[0] === "undefined") { //checks if a user does not exist
			argon2.hash(req.body.password).then((hashedPassword) => { //scrambles the password using argon2
				mysql.query(mysql.queries.createUser, [req.body.username, req.body.email, hashedPassword]).then((result) => { //creates user account in database
					console.log(result)

					jwt.sign({ //create a json web token with the account id inside (used for email conformation)
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
						}); //sends an email to the user with a link to activate the newly created account
					});

					res.send("ok");
				}).catch((error) => {
					res.status(500).send(error.message);
					console.log(error.message);
				});
			}).catch((error) => {
				res.status(500).send(error.message);
			});
		} else { //prevents registeration as user already exists
			res.send("A user already exists with this email or username");
		}
	}).catch((error) => {
		console.log(error.message);
		res.status(500).send(error.message);
	});
});

//renders all-projects.mustache to show all projects in the database
//retrieve all projects
app.get("/projects", function (request, response) {
	if (request.isAuthenticated()) {
		mysql.query(mysql.queries.getProjects, [request.user.id]).then((result) => {
			response.render("all-projects", { 
				"username": request.user.username,
				"email": request.user.email,
				"title": 'My Projects',
				"projects": "active",
				"items": result
			});
			console.log("Render all projects page with:", result);
		}).catch((error) => {
			console.log('Error retrieving all projects:', error.message);
		});
	} else {
		response.render("login");
	}
});

//renders new-project.mustache to add a new project
app.get('/projects/add', function(request, response) {
	if (request.isAuthenticated()) {
		response.render("new-project", {
			"username": request.user.username,
			"email": request.user.email,
			"projects": "active",
			'title': 'Add a new Project'
		});
		console.log("Render new project form"); 
	} else {
		response.render("login");
	}
})

//for when user clicks the delete link with argument request.params.project
//delete single project identified by id
app.get('/projects/delete/:project', function(request, response) {
	if (request.isAuthenticated()) { //check if logged in
		if (!request.params.project) { //check if param exists
			response.redirect("/projects");
			return;
		} else if(isNaN(request.params.project)) { //check if param is not a number
			response.redirect("/projects");
			return;
		}

    	mysql.query(mysql.queries.deleteProject, [request.params.project, request.user.id]).then((result) => { //fetch project
			response.redirect("/projects"); 
		}).catch((error) => {
			console.log('Error deleting project:', request.params.project, error.message);
			response.redirect("/projects"); 
		});
	} else {
		response.render("login");
	}
})

//for when user clicks the edit link, edit-projects.mustache is rendered
//retrieve one project by project id
app.get('/projects/edit/:project', function(request, response) {
	if (request.isAuthenticated()) { //check if logged in
		if (!request.params.project) { //check if param exists
			response.redirect("/projects");
			return;
		} else if(isNaN(request.params.project)) { //check if param is not a number
			response.redirect("/projects");
			return;
		}

		mysql.query(mysql.queries.getProject, [request.params.project, request.user.id]).then((result) => { //fetch project
			if (typeof result[0] === "undefined") { //if project doesn't exist
				request.redirect("/projects");
			} else {
				response.render("edit-project", {
					"username": request.user.username,
					"email": request.user.email,
					"projects": "active",
					"title": "Edit Project",
					"item": result
				});
			}
		}).catch((error) => {
			console.log('Error getting project:', request.params.project, error.message);
			response.redirect("/projects"); 
		});
	} else {
		response.render("login");
	}
})

//edit post
//update details for a project
app.post('/projects/edit/:project', function(request, response) {
	if (request.isAuthenticated()) {
		if (!request.params.project) { //check if param exists
			request.redirect("/projects");
			return;
		} else if(isNaN(request.params.project)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

		if (!request.body.title) {
			response.status(400).send("Project title must be provided.");
			return;
		}

		mysql.query(mysql.queries.editProject, [request.body.title, request.body.module, request.body.end_date, request.body.due_date, request.params.project, request.user.id]).then((result) => {
			response.send("ok");
		}).catch((error) => {
			console.log('Error editing a project:', error.message);
			response.send("There was an issue when trying to edit the project");
		});
	} else {
		response.render("login");
	}
})

//add post
app.post('/projects/add', function (request, response) {
	if (request.isAuthenticated()) {
		console.log(request.body);
		if (!request.body.title) {
			response.status(400).send("Project title must be provided.");
			return;
		}

		console.log(request.body)
		// projectDAO.addProject( request.body.project, request.body.module, request.body.intendedDate, request.body.actualDate);
		mysql.query(mysql.queries.createProject, [request.user.id, request.body.title, request.body.module, request.body.end_date, request.body.due_date]).then((result) => {
			response.send("ok");
		}).catch((error) => {
			console.log('Error creating a project:', error.message);
			response.send("There was an issue when trying to create a project");
		});
	} else {
		response.render("login");
	}
});

//renders all-milestones.mustache to show all milestones for the project
//retrieve all of the project's milestones
//added ':project' to alter url (?) (also for add, delete, and edit)
app.get("/milestones/:project", function (request, response) {
	if (request.isAuthenticated()) {
		if (!request.params.project) { //check if param exists
			request.redirect("/projects");
			return;
		} else if(isNaN(request.params.project)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

		mysql.query(mysql.queries.getProject, [request.params.project, request.user.id]).then((result) => {
			if (typeof result[0] === "undefined") { //if project doesn't exist
				request.redirect("/projects");
			} else {
				mysql.query(mysql.queries.getMilestones, [request.params.project, request.user.id]).then((milestones) => {
					response.render("all-milestones", {
						"username": request.user.username,
						"email": request.user.email,
						"title": 'Milestones',
						"project": result[0],
						"cMilestones": milestones.filter(milestone => milestone.completed_at !== null),
						"uMilestones": milestones.filter(milestone => milestone.completed_at === null)
					});
					console.log("Render all milestones page with: ", result);
				}).catch((error) => {
					console.log('Error retrieving project milestones: ', error.message);
					response.redirect("/projects");
				});
			}
		}).catch((error) => {
			console.log("Error retrieving project: ", error.message);
			response.redirect("/projects");
		});
	} else {
		response.render("login");
	}
})

//renders new-milestone.mustache to add a new milestone
app.get('/milestones/:project/add', function(request, response) {
    response.render("new-milestone", {'title':'Add a new Milestone'});
    console.log("Render new milestone form"); 
})

//for when user clicks the edit milestone link, edit-milestones.mustache is rendered
//retrieve one milestone by project id
app.get('/milestones/:project/edit/:milestone', function(request, response) {
    //get a single milestone
        response.render("edit-milestone", {
            "title": "Edit Milestone",
            "item": list
        });
    //error msg
        console.log('Error getting milestone:', request.params.milestone, err);
})

//milestones functionality still needs delete

app.listen(config.app.port, () => { //make app listen for port
	console.log("Coursework scheduler listening on port " + config.app.port);
})

app.get("/verify/:token", function(req, res) { //handles email verficiation tokens
	try {
		var user = jwt.verify(req.params.token, config.mailer.secret); //check if token is valid

		console.log(user);

		mysql.query(mysql.queries.activateUser, [user.id]).then((result) => { //activate user account
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