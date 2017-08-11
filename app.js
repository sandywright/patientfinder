'use strict';

var express = require("express");
var routes = require('./routes');
var bodyParser = require('body-parser');
var logger = require("morgan");
var session = require("express-session");
var MongoStore = require('connect-mongo')(session);
var app = express();

app.use(logger("dev"));

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// view engine set up
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');


// connect to database
var mongoose = require("mongoose");

//"mongodb://localhost:27017/pf"  || 'mongodb://heroku_fh1cmzb9:r46qhkain6dtlqqro268gu06od@ds133670.mlab.com:33670/heroku_fh1cmzb9'|| 
var uri = process.env.MONGOLAB_URI;
mongoose.connect(uri);

var db = mongoose.connection;

db.on("error", function(err){
	console.error("connection error:", err);
});

db.once("open", function(){
	console.log("db connection successful");
});

// use sessions for tracking logins
app.use(session({
	secret: 'Sandy loves you',
	resave: false, 
	saveUninitialized: true,
	store: new MongoStore({
		mongooseConnection: db
	})
})); 


// make user ID available in templates
app.use(function(req, res, next) {
	res.locals.currentUser = req.session.userId;
	next();
});

// set up cross-origin requests
// http://patientfinder.s3-website.eu-west-2.amazonaws.com
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", 'http://localhost:3000');
	res.header("Access-Control-Allow-Origin", 'http://patientfinder.s3-website.eu-west-2.amazonaws.com');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Credentials', true);
	if(req.method === "OPTIONS") {
		res.header("Access-Control-Allow-Methods", "PUT,POST,DELETE");
		return res.status(200).json({});
	}
	next();
});

// include routes
app.use("/", routes);

//Catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

//Error handler

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.json({
		error: {
			message: err.message
		}
	});
});


var port = process.env.PORT || 3001;

app.listen(port, function() {
	console.log("Express server is listening on port", port);
});