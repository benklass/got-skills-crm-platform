import React from "react";
import { toast } from "react-toastify";

import Joi from "joi-browser";
import Form from "./common/form";

import { getInstructor, saveInstructor } from "../services/instructorService";

class InstructorForm extends Form {
  state = {
    data: {
      name: "",
      email: "",
      phone: "",
      address: "",
      active: "",
    },
    errors: {},
  };

  // Validation using Joi for new instructor
  schema = {
    _id: Joi.string(),
    name: Joi.string().min(6).max(50).required().label("Name"),
    // DA 25-02-1970 Added validation for the number input
    phone: Joi.string()
      .min(7)
      .max(16)
      .regex(/^(\d{3}-\d{3}-\d{4}$)/, "Number format 999-999-9999 ")
      .required()
      .label("Phone"),
    // DA 25-02-1970 Added validation for the boolean input
    email: Joi.string().min(7).max(50).email().required(),
    address: Joi.string().min(10).max(50).required(),
    active: Joi.boolean().label("Active"),
  };

  // called from componentDidMount
  async populateInstructor() {
    try {
      const instructorId = this.props.match.params.id;
      if (instructorId === "new") return;

      const { data: instructor } = await getInstructor(instructorId);
      this.setState({ data: this.mapToViewModel(instructor) });
    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;
        case 500:
          toast.error(ex.response.data);
          break;
        default:
          toast.error("InstructorForm : Unspecified Error Occured");
      }
      this.props.history.replace("/not-found");
    }
  }

  async componentDidMount() {
    await this.populateInstructor();
  }

  // You can remap data models from server to the display component
  mapToViewModel(instructor) {
    return {
      _id: instructor._id,
      name: instructor.name,
      phone: instructor.phone,
      email: instructor.email,
      address: instructor.address,

      active: instructor.active,
    };
  }

  doSubmit = async () => {
    // Call the server
    try {
      await saveInstructor(this.state.data);
      // DA 26 02 2023 Changed to go to page which called the edit
      // this.props.history.replace("/instructors");
      this.props.history.goBack();
    } catch (ex) {
      switch (ex.response.status) {
        case 400:
          toast.error(ex.response.data + " Correct Input");
          break;
        case 500:
          toast.error(ex.response.data);
          this.props.history.goBack();
          break;
        default:
          toast.error("instructorForm : Unspecified Error Occured");
          this.props.history.goBack();
      }
    }
  };

  render() {
    return (
      <div>
        <h1>Instructor</h1>

        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              {this.renderInput("name", "Name")}
              {this.renderInput("phone", "Phone")}
              {this.renderInput("email", "Email")}
              {this.renderTextarea("address", "Address", "text", "4")}
            </div>

            <div className="col-md-6">
              {this.renderUseSelect("active", "Instructor Active")}

              <div className="text-right border-top">
                {this.renderButton("Save")}
                {this.renderLink("/instructors", "Exit")}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default InstructorForm;
