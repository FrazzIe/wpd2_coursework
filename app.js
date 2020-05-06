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
		mysql.query(mysql.queries.currentProjects, [req.user.id]).then((projects) => {
			mysql.query(mysql.queries.currentMilestones, [req.user.id]).then((milestones) => {
				res.render("home", {
					user: [
						{
							username: req.user.username,
							email: req.user.email
						}
					],
					title: "Home",
					projects: projects,
					milestones: milestones
				});
			}).catch((error) => {
				res.status(500).render("500");
				console.log(error.message);
			});
		}).catch((error) => {
			res.status(500).render("500");
			console.log(error.message);
		});
	} else {
		res.render("login", {
			title: "Login",
		});
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
	mysql.query(mysql.queries.findUser, [req.body.username, req.body.email]).then((result) => { //finds any rows with the username or email
		if (typeof result[0] === "undefined") { //checks if a user does not exist
			argon2.hash(req.body.password).then((hashedPassword) => { //scrambles the password using argon2
				mysql.query(mysql.queries.createUser, [req.body.username, req.body.email, hashedPassword]).then((result) => { //creates user account in database
					jwt.sign({ //create a json web token with the account id inside (used for email conformation)
						id: result.insertId,
					}, config.mailer.secret, {
						expiresIn: "1d"
					}, function(err, token) {
						if (err) { 
							res.send(err.message);
							console.log(err.message);
						}
						const url = req.getUrl() + "/verify/" + token
						mailer.sendMail({
							to: req.body.email,
							subject: config.mailer.subject,
							html: config.mailer.body.format(req.body.username, url)
						}).then((info) => {
							console.log(info);
						}).catch((error) => {
							console.log(error.message);
							res.send(error.message)	;
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
				"user": [
					{
						"username": request.user.username,
						"email": request.user.email
					}
				],
				"title": 'My Projects',
				"projects": "active",
				"items": result
			});
		}).catch((error) => {
			console.log('Error retrieving all projects:', error.message);
		});
	} else {
		response.redirect("/");
	}
});

//renders new-project.mustache to add a new project
app.get('/projects/add', function(request, response) {
	if (request.isAuthenticated()) {
		response.render("new-project", {
			"user": [
				{
					"username": request.user.username,
					"email": request.user.email
				}
			],
			"projects": "active",
			'title': 'Add a new Project'
		});
	} else {
		response.redirect("/");
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
		response.redirect("/");
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
					"user": [
						{
							"username": request.user.username,
							"email": request.user.email
						}
					],
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
		response.redirect("/");
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
		response.redirect("/");
	}
})

//add post
app.post('/projects/add', function (request, response) {
	if (request.isAuthenticated()) {
		if (!request.body.title) {
			response.status(400).send("Project title must be provided.");
			return;
		}

		mysql.query(mysql.queries.createProject, [request.user.id, request.body.title, request.body.module, request.body.end_date, request.body.due_date]).then((result) => {
			response.send("ok");
		}).catch((error) => {
			console.log('Error creating a project:', error.message);
			response.send("There was an issue when trying to create a project");
		});
	} else {
		response.redirect("/");
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
						"user": [
							{
								"username": request.user.username,
								"email": request.user.email
							}
						],
						"title": 'Milestones',
						"project": result[0],
						"cMilestones": milestones.filter(milestone => milestone.completed_at !== null),
						"uMilestones": milestones.filter(milestone => milestone.completed_at === null)
					});
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
		response.redirect("/");
	}
})

//renders new-milestone.mustache to add a new milestone
app.get('/milestones/:project/add', function(request, response) {
	if (request.isAuthenticated()) {
		if (!request.params.project) { //check if param exists
			request.redirect("/projects");
			return;
		} else if(isNaN(request.params.project)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

		response.render("new-milestone", {
			'title': 'Add a new Milestone',
			'project_id': request.params.project
		});
	} else {
		response.redirect("/");
	}
})

app.post('/milestones/:project/add', function (request, response) {
	if (request.isAuthenticated()) {
		if (!request.params.project) { //check if param exists
			request.redirect("/projects");
			return;
		} else if(isNaN(request.params.project)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

		if (!request.body.title) {
			response.status(400).send("Milestone title must be provided.");
			return;
		}

		//make sure this project belongs to the user
		mysql.query(mysql.queries.getProject, [request.params.project, request.user.id]).then((result) => {
			if (typeof result[0] === "undefined") { //if project doesn't exist
				response.send("The project you were creating this milestone for does not belong to you");
			} else {
				mysql.query(mysql.queries.createMilestone, [request.params.project, request.body.title, request.body.desc]).then((result) => {
					response.send("ok");
				}).catch((error) => {
					console.log('Error creating a milestone: ', error.message);
					response.send("There was an issue when trying to create a milestone");
				});
			}
		}).catch((error) => {
			console.log("Error retrieving project: ", error.message);
			response.send("The project you were creating this milestone for does not exist");
		});
	} else {
		response.redirect("/");
	}
});

//for when user clicks the edit milestone link, edit-milestones.mustache is rendered
//retrieve one milestone by project id
app.get('/milestones/:project/edit/:milestone', function(request, response) {
	if (request.isAuthenticated()) {
		if (!request.params.project || !request.params.milestone) { //check if param exists
			request.redirect("/projects");
			return;
		} else if (isNaN(request.params.project) || isNaN(request.params.milestone)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

		//get a single milestone
		mysql.query(mysql.queries.getMilestone, [request.params.milestone, request.user.id]).then((result) => {
			response.render("edit-milestone", {
				"user": [
					{
						"username": request.user.username,
						"email": request.user.email
					}
				],
				"title": "Edit Milestone",
				"item": result
			});
		}).catch((error) => {
			console.log('Error getting milestone:', request.params.milestone, error.message);
			response.redirect("/milestones/" + request.params.project); 			
		});
	} else {
		response.redirect("/");
	}
})

//edit post
//update details for a milestone
app.post('/milestones/:project/edit/:milestone', function(request, response) {
	if (request.isAuthenticated()) {
		if (!request.params.project || !request.params.milestone) { //check if param exists
			request.redirect("/projects");
			return;
		} else if (isNaN(request.params.project) || isNaN(request.params.milestone)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

		if (!request.body.title) {
			response.status(400).send("Milestone title must be provided.");
			return;
		}

		mysql.query(mysql.queries.editMilestone, [request.body.title, request.body.desc, request.params.milestone, request.user.id]).then((result) => {
			response.send("ok");
		}).catch((error) => {
			console.log('Error editing a milestone: ', error.message);
			response.send("There was an issue when trying to edit the milestone");
		});
	} else {
		response.redirect("/");
	}
})

//for when user clicks the delete link with argument request.params.project
//delete single milestone identified by id
app.get('/milestones/:project/delete/:milestone', function(request, response) {
	if (request.isAuthenticated()) { //check if logged in
		if (!request.params.project || !request.params.milestone) { //check if param exists
			request.redirect("/projects");
			return;
		} else if (isNaN(request.params.project) || isNaN(request.params.milestone)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

    	mysql.query(mysql.queries.deleteMilestone, [request.params.milestone, request.params.project, request.user.id]).then((result) => { //delete milestone
			response.redirect("/milestones/" + request.params.project);
		}).catch((error) => {
			console.log('Error deleting milestone: ', request.params.milestone, error.message);
			response.redirect("/milestones/" + request.params.project);
		});
	} else {
		response.redirect("/");
	}
})

//for when user clicks the complete milestone link
//moves a milestone to the completed category
app.get('/milestones/:project/complete/:milestone', function(request, response) {
	if (request.isAuthenticated()) { //check if logged in
		if (!request.params.project || !request.params.milestone) { //check if param exists
			request.redirect("/projects");
			return;
		} else if (isNaN(request.params.project) || isNaN(request.params.milestone)) { //check if param is not a number
			request.redirect("/projects");
			return;
		}

		//var currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    	mysql.query(mysql.queries.completeMilestone, ["CURRENT_DATE()", request.params.milestone, request.user.id]).then((result) => { //delete milestone
			response.redirect("/milestones/" + request.params.project);
		}).catch((error) => {
			console.log('Error deleting milestone: ', request.params.milestone, error.message);
			response.redirect("/milestones/" + request.params.project);
		});
	} else {
		response.redirect("/");
	}
})

app.get("/verify/:token", function(req, res) { //handles email verficiation tokens
	try {
		var user = jwt.verify(req.params.token, config.mailer.secret); //check if token is valid

		mysql.query(mysql.queries.activateUser, [user.id]).then((result) => { //activate user account
			res.redirect("/");
		}).catch((error) => {
			res.status(500).send(error.message);
			console.log((error.message));
		});       
	} catch(e) {
		console.log(e.message);
		res.redirect("/");
	}
});

app.post("/projects/share/:project", function(req, res) {
	if (req.isAuthenticated()) {
		if (!req.params.project) { //check if param exists
			req.redirect("/projects");
			return;
		} else if (isNaN(req.params.project)) { //check if param is not a number
			req.redirect("/projects");
			return;
		}

		jwt.sign({ //create a json web token with the account id inside (used for email conformation)
			project: req.params.project,
			user: req.user.id
		}, config.share.secret, {
			expiresIn: "1d"
		}, function(err, token) {
			if (err) { 
				res.send({ error: err.message });
				return;
			}

			res.send({ url: req.getUrl() + "/view/" + token	})
		});
	} else {
		res.redirect("/");
	}
})

app.get("/view/:token", function(req, res) {
	try {
		var data = jwt.verify(req.params.token, config.share.secret); //check if token is valid
 
		mysql.query(mysql.queries.getProject, [data.project, data.user]).then((result) => {
			if (typeof result[0] === "undefined") { //if project doesn't exist
				req.redirect("/projects");
			} else {
				mysql.query(mysql.queries.getMilestones, [data.project, data.id]).then((milestones) => {
					var resObj = {
						"title": "Project Overview",
						"project": result[0],
						"cMilestones": milestones.filter(milestone => milestone.completed_at !== null),
						"uMilestones": milestones.filter(milestone => milestone.completed_at === null)						
					}

					if (req.isAuthenticated()) {
						resObj.user = [
							{
								"username": req.user.username,
								"email": req.user.email
							}
						]
					}

					res.render("shared-project", resObj);
				}).catch((error) => {
					console.log('Error retrieving project milestones: ', error.message);
					res.redirect("/projects");
				});
			}
		}).catch((error) => {
			console.log("Error retrieving project: ", error.message);
			res.redirect("/projects");
		});
	} catch(e) {
		console.log(e.message);
		res.redirect("/");
	}
});

app.listen(config.app.port, () => { //make app listen for port
	console.log("Coursework scheduler listening on port " + config.app.port);
})