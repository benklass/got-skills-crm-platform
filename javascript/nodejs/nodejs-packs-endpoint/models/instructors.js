const Joi = require("joi");
const mongoose = require("mongoose");

const instructorSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  phone: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 16,
  },
  address: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const Instructor = mongoose.model("Instructor", instructorSchema);

// function validateInstructor
function validateInstructor(instructor) {
  const schema = {
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(50).required().email(),
    phone: Joi.string().min(7).required(),
    address: Joi.string().min(5).max(50).required(),
    active: Joi.boolean(),
  };

  return Joi.validate(instructor, schema);
}

module.exports.instructorSchema = instructorSchema;
module.exports.Instructor = Instructor;
module.exports.validateInstructor = validateInstructor;
