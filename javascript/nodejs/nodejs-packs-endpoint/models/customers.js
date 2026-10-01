const mongoose = require("mongoose");
const Joi = require("joi");

// Create schema

const Customer = mongoose.model(
  "Customer",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 50,
    },
    grade: {
      type: String,
      required: true,
      minlength: 7,
      maxlength: 25,
    },
    email: {
      type: String,
      required: true,
      minlength: 7,
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
      maxlength: 255,
    },
    comments: {
      type: String,
      maxlength: 2000,
    },
    active: {
      type: Boolean,
      default: true,
    },
  })
);

// function validateCustomers
function validateCustomers(customer) {
  const schema = {
    name: Joi.string().min(5).max(50).required(),
    grade: Joi.string().min(7).max(25).required(),
    email: Joi.string().min(7).max(50).email().required(),
    phone: Joi.string().min(7).required(),
    address: Joi.string().min(5).max(255).required(),
    comments: Joi.string().max(2000),
    active: Joi.boolean(),
  };

  return Joi.validate(customer, schema);
}

module.exports.Customer = Customer;
module.exports.validateCustomers = validateCustomers;
