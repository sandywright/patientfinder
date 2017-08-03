'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var sortPatients = function(a, b) {
	return b.updatedAt - a.updatedAt;
};

var PatientSchema = new Schema({
	location: String, 
	bed: String,
	gender: String,
	age: Number,
	background: String,
	createdAt: {type: Date, default: Date.now}, 
	updatedAt: {type: Date, default: Date.now},
	addedBy: String, 
	clerks: {type: Number, default: 0} 
});

PatientSchema.method("update", function(updates, callback) {
	Object.assign(this, updates, {updatedAt: new Date()});
	this.parent().save(callback);
});

PatientSchema.method("clerk", function(clerk, callback) {
	if(clerk === "up") {
		this.clerks += 1;
	} else {
		this.clerks -= 1;
	}
	this.parent().save(callback);

});

var HospitalSchema = new Schema({
	name: String, 
	updatedAt: {type: Date, default: Date.now}, 
	patients: [PatientSchema]
});

HospitalSchema.pre("save", function(next){
	this.patients.sort(sortPatients);
	this.updatedAt = Date.now() 
	next();
});


var Hospital = mongoose.model("Hospital", HospitalSchema);

module.exports.Hospital = Hospital;