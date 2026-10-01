const jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");
const mongoose = require("mongoose");

// User document

const userSchema = new mongoose.Schema({
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
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  isAdmin: { type: Boolean },
  isInstructor: { type: Boolean },
  isStudent: { type: Boolean },
  isParent: { type: Boolean },
  linkInstructorId: {
    type: String,
    default: "N/A",
    minlength: 3,
    maxlength: 24,
  },
  linkStudentId: {
    type: String,
    default: "N/A",
    minlength: 3,
    maxlength: 24,
  },

  // roles: [],
  // operations: []
});

// Information Expert Principle
// NB CAN NOT USE () => function as 'this' can not be used need to define a function() to call
// Can add a method to object to be used when calling to generate a auth Token to use in header field x-auth-token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
      isInstructor: this.isInstructor,
      isStudent: this.isStudent,
      isParent: this.isParent,
      linkInstructorId: this.linkInstructorId,
      linkStudentId: this.linkStudentId,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    linkInstructorId: Joi.string().min(3).max(24).optional(),
    linkStudentId: Joi.string().min(3).max(24).optional(),
    isAdmin: Joi.boolean().optional(),
    isParent: Joi.boolean().optional(),
    isStudent: Joi.boolean().optional(),
    isInstructor: Joi.boolean().optional(),
  })
    .and("isAdmin", "isInstructor", "isStudent", "isParent")
    .when(
      Joi.object({
        isAdmin: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isInstructor: Joi.boolean().valid(false),
          isStudent: Joi.boolean().valid(false),
          isParent: Joi.boolean().valid(false),
        }),
      }
    )
    .when(
      Joi.object({
        isInstructor: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isAdmin: Joi.boolean().valid(false),
          isStudent: Joi.boolean().valid(false),
          isParent: Joi.boolean().valid(false),
        }),
      }
    )
    .when(
      Joi.object({
        isStudent: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isAdmin: Joi.boolean().valid(false),
          isInstructor: Joi.boolean().valid(false),
          isParent: Joi.boolean().valid(false),
        }),
      }
    )
    .when(
      Joi.object({
        isParent: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isAdmin: Joi.boolean().valid(false),
          isInstructor: Joi.boolean().valid(false),
          isStudent: Joi.boolean().valid(false),
        }),
      }
    );

  return schema.validate(user);
}

module.exports.User = User;
module.exports.validateUser = validateUser;
