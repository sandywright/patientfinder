'use strict';

var express = require("express");
var app = express();
var routes = require('./routes');
var bodyParser = require('body-parser');
var logger = require("morgan");
var session = require("express-session");

// use sessions for tracking logins
app.use(session({
	secret: 'Sandy loves you',
	resave: true, 
	saveUninitialized: false
}));

app.use(logger("dev"));

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// view engine set up
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');


// connec to database
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/pf");

var db = mongoose.connection;

db.on("error", function(err){
	console.error("connection error:", err);
});

db.once("open", function(){
	console.log("db connection successful");
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


var port = process.env.PORT || 3000;

app.listen(port, function() {
	console.log("Express server is listening on port", port);
});