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

// connect to database
var mongoose = require("mongoose");

//'mongodb://localhost:27017/pf'"mongodb://heroku_4xl7chh6:g1prk8lm3t94dqmqimhhhue71t@ds151450.mlab.com:51450/heroku_4xl7chh6" || process.env.MONGODB_URI || 
var uri = 'mongodb://heroku_4xl7chh6:g1prk8lm3t94dqmqimhhhue71t@ds151450.mlab.com:51450/heroku_4xl7chh6';
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

// set up cross-origin requests
// http://localhost:3000
// http://patientfinder.s3-website.eu-west-2.amazonaws.com
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", 'http://patientfinder.s3-website.eu-west-2.amazonaws.com');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Credentials', true);
	if(req.method === "OPTIONS") {
		res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		return res.status(200).json({});
	}

	next();
});

// Include routes
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