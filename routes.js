'use strict';

var express = require('express');
var router = express.Router();
var Hospital = require('./models/hospital').Hospital;
var User = require('./models/user').User;

router.param("hID", function(req, res, next, id){
	Hospital.findById(id, function(err, doc){
		if(err) return next(err);
		if(!doc) {
			err = new Error("Not Found");
			err.status = 404;
			return next(err);
		}
		req.hospital = doc;
		return next();
	});
});

router.param("pID", function(req, res, next, id){
	req.patient = req.hospital.patients.id(id);
	if(!req.patient) {
		err = new Error("Not Found");
		err.status = 404;
		return next(err);
	}
	next();
});

//GET /login
router.get("/login", function(req, res, next) {
	return res.render('login', { title: 'Login'});
});

//POST /login
router.post("/login", function(req, res, next) {
	if (req.body.email && req.body.password) {
		User.authenticate(req.body.email, req.body.password, function(error, user) {
			if(error || !user) {
				var err = new Error('Wrong email or password');
				err.status = 401;
				return next(err);
			} else {
				req.session.userId = user._id;
				return res.redirect('/hospitals');
			}
		});
	} else {
		var err = new Error("Email and password are required.");
		err.status = 401;
		return next(err);
	}
});


//GET /Register
// Route for new user resgistration
router.get("/register", function(req, res, next) {
	return res.render('register', { title: 'Sign Up'});
});

//POST /Register
// Route for new user registration posting
router.post("/register", function(req, res, next) {
	if (req.body.name &&
		req.body.email &&
		req.body.password &&
		req.body.confirmPassword) {

		//confirm that passwords match
		if (req.body.password !== req.body.confirmPassword) {
			var err = new Error('Passwords do not match');
			err.status = 400;
			return next(err);
		}

		// create object with form input
		var userData = {
			email: req.body.email, 
			name: req.body.name, 
			password: req.body.password
		};

		// use schema 'create' method to insert document into mongo
		User.create(userData, function(error, user) {
			if (error) {
				return next(error);
			} else {
				req.session.userId = user._id;
				return res.redirect('/hospitals');
			}
		});

	} else {
		var err = new Error('All fields required.');
		err.status = 400;
		return next(err);
	}
});

//GET /hospitals
// Route for hospitals collection
router.get("/hospitals", function(req, res, next) {
	if(! req.session.userId) {
		var err = new Error("You are not authorized to view this page");
		err.status = 403;
		return next(err);
	}
	User.findById(req.session.userId)
		.exec(function(error, user) {
			if (error) {
				return next(error);
			} else {
				Hospital.find({}, null, {sort: {createdAt: -1}}, function(err, hospitals){
					if(err) return next(err);
					res.json(hospitals);
				});
			}
		});
});

//POST /hospitals
// Route for creating hospital
router.post("/hospitals", function(req, res, next) {
	var hospital = new Hospital(req.body);
	hospital.save(function(err, hospital){
		if(err) return next(err);
		res.status(201);
		res.json(hospital);
	});
});

//GET /hospitals/:id
// Route for specific hospital
router.get("/hospitals/:hID", function(req, res, next) {
		res.json(req.hospital);
});

//POST /hospitals/:id/patients
// Route for creating a patient
router.post("/hospitals/:hID/patients", function(req, res, next) {
	req.hospital.patients.push(req.body);
	req.hospital.save(function(err, hospital){
		if(err) return next(err);
		res.status(201);
		res.json(hospital);
	});
});

//PUT /hospitals/:hID/patients/:pID
// Edit a specific patient
router.put("/hospitals/:hID/patients/:pID", function(req, res) {
	req.patient.update(req.body, function(err, result) {
		if(err) return next(err);
		res.json(result);

	});
});

//DELETE /hospitals/:hID/patients/:pID
// Delete a specific patient
router.delete("/hospitals/:hID/patients/:pID", function(req, res) {
	req.patient.remove(function(err){
		req.hospital.save(function(err, hospital){
			if(err) return next(err);
			res.json(hospital);
		});
	});	
});

//POST /hospitals/:hID/patients/:pID/clerk-up
// Clerk a specific patient
router.post("/hospitals/:hID/patients/:pID/clerk-:dir", 
	function(req, res, next) {
		if(req.params.dir.search(/^(up|down)$/) === -1) {
			var err = new Error("Not Found");
			err.status = 404;
			next(err);
		} else {
			req.clerk = req.params.dir;
			next();
		}
	},
	function(req, res, next){
		req.patient.clerk(req.clerk, function(err, hospital) {
			if(err) return next(err);
			res.json(hospital);
		});
});


module.exports = router;