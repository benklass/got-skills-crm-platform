import React from "react";
import Joi from "joi-browser";
import Form from "./common/form";
import * as userService from "../services/userService";
import auth from "../services/authService";

class RegisterForm extends Form {
  state = {
    data: {
      username: "",
      password: "",
      name: "",
      isAdmin: false,
      isInstructor: false,
      isStudent: true,
      isParent: false,
      linkInstructorId: "N/A",
      linkStudentId: "N/A",
    },
    errors: {},
  };

  // Validation using Joi
  schema = {
    username: Joi.string().required().email().label("Username"),
    password: Joi.string().required().min(5).label("Password"),
    name: Joi.string().min(6).required().label("Full Name"),
    isAdmin: Joi.boolean().optional(),
    isInstructor: Joi.boolean().optional(),
    isStudent: Joi.boolean().optional(),
    isParent: Joi.boolean().optional(),
    linkInstructorId: Joi.string().min(3).max(24).optional(),
    linkStudentId: Joi.string().min(3).max(24).optional(),
  };

  doSubmit = async () => {
    // Call the server
    try {
      const response = await userService.register(this.state.data);
      console.log(
        "here in registerForm.jsx - doSubmit :",
        this.state.data,
        response
      );
      // Error out if no space on client to write to localstorage
      try {
        auth.loginWithJwt(response.headers["x-auth-token"]);
        window.location = "/";
      } catch (innerEx) {
        if (innerEx.name === "QuotaEceededError") {
          const errors = { ...this.state.errors };
          errors.username = innerEx.name;
          this.setState({ errors });
          this.props.history.push("/");
        }
      }
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const errors = { ...this.state.errors };
        errors.username = ex.response.data;
        this.setState({ errors });
      }
    }
  };

  render() {
    return (
      <div>
        <h1>Register</h1>
        <form onSubmit={this.handleSubmit}>
          {this.renderInput("username", "Username", "email")}
          {this.renderInput("password", "Password", "password")}
          {this.renderInput("name", "Full Name")}
          {this.renderButton("Register")}
        </form>
      </div>
    );
  }
}

export default RegisterForm;
