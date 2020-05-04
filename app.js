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
				"title": 'My Projects',
				"projects": result
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
    response.render("new-project", {
		'title': 'Add a new Project'
	});
    console.log("Render new project form"); 
})

//for when user clicks the delete link with argument request.params.project
//delete single project identified by id
app.get('/projects/delete/:project', function(request, response) {
    // projectDAO.deleteProject(request.params.project);
    response.redirect("/projects"); 
})

//for when user clicks the edit link, edit-projects.mustache is rendered
//retrieve one project by project id
app.get('/projects/edit/:project', function(request, response) {
    // projectDAO.getOneProject(request.params.project)
    // .then((list) => {
    //     response.render("edit-project", {
    //         "title": "Edit Project",
    //         "item": list
    //     });
    // })
    // .catch((err) => {
    //     console.log('Error getting project:', request.params.project, err);
    // });
})

//edit post
//update details for a project
app.post('/projects/edit/:project', function(request, response) {
    // projectDAO.updateProject( request.body.project, request.body.module, request.body.intendedDate, request.body.actualDate);
    response.redirect("/projects");
})

//add post
app.post('/projects/add', function (request, response) {
    if (!request.body.project) {
        response.status(400).send("Project must be provided.");
        return;
    }
    // projectDAO.addProject( request.body.project, request.body.module, request.body.intendedDate, request.body.actualDate);
    response.redirect("/projects");
});


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