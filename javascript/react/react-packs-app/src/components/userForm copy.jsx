import React from "react";
import { toast } from "react-toastify";

import Joi from "joi-browser";
import Form from "./common/form";

import { getUsers, getUser, saveUser } from "../services/userService";

import { getInstructors } from "../services/intructorService";
import { getCustomers } from "../services/customerService";

import { getCurrentUser } from "../services/authService";

class UserForm extends Form {
  state = {
    data: {
      name: "",
      email: "",
      password: "",
      isAdmin: false,
      isInstructor: false,
      isStudent: false,
      isParent: false,
      linkInstructorId: "N/A",
      linkStudentId: "N/A",
      userType: "",
      userTypeName: "N/A",
    },
    instructors: [],
    students: [],
    users: [],
    errors: {},
    saveRecord: true,
  };

  // Validation using Joi for edit and new user
  schema = {
    _id: Joi.string(),
    name: Joi.string().min(6).max(50).required().label("Full Name"),
    email: Joi.string().min(7).max(50).email().required(),
    password: Joi.string().min(5).required().label("Password"),
    userType: Joi.string().label("User Type"),
    isAdmin: Joi.boolean().optional(),
    isInstructor: Joi.boolean().optional(),
    isStudent: Joi.boolean().optional(),
    isParent: Joi.boolean().optional(),
    linkInstructorId: Joi.string().min(3).max(24).required(),
    linkStudentId: Joi.string().min(3).max(24).required(),
    userTypeName: Joi.string().optional(),
  };

  // called from componentDidMount
  async populateUser() {
    try {
      const userId = this.props.match.params.id;

      if (userId === "new") return;

      const { data: user } = await getUser(userId);

      this.setState({ data: this.mapToViewModel(user) });
    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;
        case 500:
          toast.error(ex.response.data);
          break;
        default:
          toast.error("UserForm : Unspecified Error Occured");
      }
      this.props.history.replace("/not-found");
    }
  }

  // called from componentDidMount
  async populateUsers() {
    try {
      //const userId = this.props.match.params.id;

      //if (userId === "new") return;

      const { data: users } = await getUsers();
      this.setState({ users });
      console.log("here in populateUsers - it sets state:", users);
    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;
        case 500:
          toast.error(ex.response.data);
          break;
        default:
          toast.error("UserForm : Unspecified Error Occured");
      }
      this.props.history.replace("/not-found");
    }
  }

  async componentDidMount() {
    // Populate instructor and student here is isStudent, isParent or isInstructor
    await this.populateUser();
    await this.populateInstructors();
    await this.populateUserTypeName();
    await this.populateUsers();
    const loggedInUserType = getCurrentUser();
    this.setState({ saveRecord: false });

    console.log("here in userForm - componentDidMount : ", loggedInUserType);
  }

  // Use this to check if Student, Parent or Instructor Selected
  async componentDidUpdate(preProps, prevState) {
    const userType = this.state.data.userType;

    if (prevState.data.userType !== this.state.data.userType) {
      if (!this.state.students[0]) {
        this.populateStudents();
      }
      if (!this.state.instructors[0]) {
        this.populateInstructors();
      }

      if (userType === "isStudent") {
        await this.validateLinkedStudent();
      }
      if (userType === "isInstructor") {
        await this.validateLinkedInstructor();
      }
      this.setState({ saveRecord: true });
      // console.log(
      //   "here is componentDidUpdate - Do something : ",
      //   userType,
      //   this.state.data,
      //   this.state.users
      // );
    }
  }

  // You can remap data models from server to the display component
  mapToViewModel(user) {
    //console.log("here in mapToViewModel - it sets state :", user);
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      isAdmin: user.isAdmin,
      isInstructor: user.isInstructor,
      isParent: user.isParent,
      isStudent: user.isStudent,
      linkInstructorId: user.linkInstructorId ? user.linkInstructorId : "N/A",
      linkStudentId: user.linkStudentId ? user.linkStudentId : "N/A",
    };
  }

  // Unset linked Records for Admin
  handleAdmin = async (dataWithoutUserType) => {
    this.setState({
      data: {
        ...dataWithoutUserType,
        linkStudentId: "N/A",
        linkInstructorId: "N/A",
      },
    });
  };

  // Unset linked Records for Instructor and Set InstructorId
  handleInstructor = async (dataWithoutUserType) => {
    this.setState(
      {
        data: {
          ...dataWithoutUserType,
          linkStudentId: "N/A",
        },
      },
      () => {
        //console.log("here in handleInstructor - state", this.state.data);
      }
    );
  };

  // Set instructors for instructor userType for selection
  async populateInstructors() {
    try {
      const { data: instructors } = await getInstructors();
      this.setState({ instructors });
    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;
        case 500:
          toast.error(ex.response.data);
          break;
        default:
          toast.error("UserForm : Unspecified Error Occured");
      }
    }
  }

  handleStudent = async (dataWithoutUserType) => {
    this.setState(
      {
        data: {
          ...dataWithoutUserType,
          linkInstructorId: "N/A",
        },
      },
      () => {
        //console.log("here in handleInstructor - state", this.state.data);
      }
    );
  };

  // Set students for student userType for selection &
  async populateStudents() {
    try {
      const { data: students } = await getCustomers();
      this.setState({ students });
    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;
        case 500:
          toast.error(ex.response.data);
          break;
        default:
          toast.error("UserForm : Unspecified Error Occured");
      }
    }
  }

  // Set UserTypeName in state
  async populateUserTypeName() {
    if (
      this.state.data.linkInstructorId !== "N/A" &&
      this.state.data.linkStudentId === "N/A"
    ) {
      await this.populateInstructors();
      const linkedInstructor = this.state.instructors.find(
        (instructor) => instructor._id === this.state.data.linkInstructorId
      );
      this.setState({
        data: {
          ...this.state.data,
          userTypeName:
            "Instructor : " +
            linkedInstructor.name +
            "," +
            linkedInstructor.email,
        },
      });
      // console.log(
      //   "here in populate userTypeName :",
      //   this.state.data.linkInstructorId,
      //   this.state.instructors,
      //   linkedInstructor
      // );
    }

    // This will set userTypeName for isStudent and isParent
    if (
      this.state.data.linkStudentId !== "N/A" &&
      this.state.data.linkInstructorId === "N/A"
    ) {
      await this.populateStudents();
      const linkedStudent = this.state.students.find(
        (student) => student._id === this.state.data.linkStudentId
      );
      this.setState({
        data: {
          ...this.state.data,
          userTypeName:
            "Student : " + linkedStudent.name + "," + linkedStudent.email,
        },
      });
      // console.log(
      //   "here in populate userTypeName :",
      //   this.state.data.linkStudentId,
      //   this.state.students,
      //   linkedStudent
      // );
    }
  }

  async validateLinkedInstructor() {
    const linkedInstructor = this.state.users.find(
      (user) =>
        user._id !== this.state.data._id &&
        user.linkInstructorId !== "N/A" &&
        user.linkInstructorId === this.state.data.linkInstructorId
    );
    const errors = { ...this.state.errors };
    if (linkedInstructor) {
      toast.warning(
        "Instructor already linked to User " + linkedInstructor.email
      );
      errors["userTypeName"] =
        "Instructor linked to User " + linkedInstructor.email;
      this.setState({ saveRecord: false });
    } else {
      delete errors["userTypeName"];
    }
    this.setState({ errors });
  }

  async validateLinkedStudent() {
    const linkedStudent = this.state.users.find(
      (user) =>
        user._id !== this.state.data._id &&
        user.linkStudentId !== "N/A" &&
        user.linkStudentId === this.state.data.linkStudentId
    );
    const errors = { ...this.state.errors };
    if (linkedStudent) {
      toast.warning("Student already linked to User " + linkedStudent.email);
      errors["userTypeName"] = "Student linked to User " + linkedStudent.email;
      this.setState({ saveRecord: false });
    } else {
      delete errors["userTypeName"];
    }
    this.setState({ errors });
  }

  doSubmit = async () => {
    // Call the server
    try {
      // DA 26 04 23 Removed userType before userSave for userType Select
      // await saveUser(this.state.data);
      const { userType, userTypeName, ...dataWithoutUserType } =
        this.state.data;

      // Set the appropriate boolean value to true
      switch (userType) {
        case "isAdmin":
          dataWithoutUserType.isAdmin = true;
          dataWithoutUserType.isInstructor = false;
          dataWithoutUserType.isStudent = false;
          dataWithoutUserType.isParent = false;

          // Unset linkStudent, linkInstructor
          await this.handleAdmin(dataWithoutUserType);

          break;
        case "isInstructor":
          dataWithoutUserType.isAdmin = false;
          dataWithoutUserType.isInstructor = true;
          dataWithoutUserType.isStudent = false;
          dataWithoutUserType.isParent = false;

          // Set linkInstructor
          // Unset linkStudent
          await this.handleInstructor(dataWithoutUserType);
          await this.validateLinkedInstructor();

          break;
        case "isStudent":
          dataWithoutUserType.isAdmin = false;
          dataWithoutUserType.isInstructor = false;
          dataWithoutUserType.isStudent = true;
          dataWithoutUserType.isParent = false;

          // Set linkStudent
          // Unset linkInstructor
          await this.handleStudent(dataWithoutUserType);
          await this.validateLinkedStudent();
          break;
        case "isParent":
          dataWithoutUserType.isAdmin = false;
          dataWithoutUserType.isInstructor = false;
          dataWithoutUserType.isStudent = false;
          dataWithoutUserType.isParent = true;

          // Set linkStudent
          // Unset linkInstructor
          // This is the same as the Student setup as the Parent is linked to the student.
          // NOTE: At this stage of the application there is nothing different in the Parent setup
          // It may change
          await this.handleStudent(dataWithoutUserType);

          break;
        default:
          break;
      }

      // console.log(
      //   "here in userForm doSubmit - userType",
      //   userType,
      //   this.state.saveRecord,
      //   dataWithoutUserType,
      //   this.state.data
      // );
      if (this.state.saveRecord === true) {
        await saveUser(this.state.data);
        this.props.history.goBack();
      }

      // DA 26 02 2023 Changed to go to page which called the edit
    } catch (ex) {
      switch (ex.response.status) {
        case 400:
          toast.error(ex.response.data + " Correct Input");
          break;
        case 500:
          toast.error(ex.response.data);

          break;
        default:
          toast.error("userForm : Unspecified Error Occured");
      }
      this.props.history.goBack();
    }
  };

  render() {
    // DA 26-04-23 Added to check if new user userId === "new"
    const userId = this.props.match.params.id;
    const userIsAdmin = this.props.user.isAdmin;
    const userType = this.state.data.userType;

    return (
      <div>
        <h1>{userId === "new" ? "Add User" : "Modify User"}</h1>

        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              {this.renderInput("name", "Full Name")}
              {this.renderInput("email", "Login Email", "email")}
              {userId === "new" ||
              userIsAdmin === true ||
              userId === this.props.user._id
                ? this.renderInput("password", "Password", "password")
                : this.renderMaskPasswordReadOnly("password", "Password")}
              {this.renderInputReadOnly("userTypeName", "Linked To")}
              <div className="row">
                <div className="col-md-4">
                  {this.state.data.isAdmin === true
                    ? this.renderInputReadOnly("isAdmin", "Admin")
                    : null}

                  {this.state.data.isInstructor === true
                    ? this.renderInputReadOnly("isInstructor", "Instructor")
                    : null}

                  {this.state.data.isStudent === true
                    ? this.renderInputReadOnly("isStudent", "Student")
                    : null}

                  {this.state.data.isParent === true
                    ? this.renderInputReadOnly("isParent", "Parent")
                    : null}
                </div>
                <div className="col-md-4">
                  {userIsAdmin === true
                    ? this.renderSelect("userType", "User Type", [
                        { _id: "isAdmin", name: "isAdmin" },
                        { _id: "isInstructor", name: "isInstructor" },
                        { _id: "isStudent", name: "isStudent" },
                        { _id: "isParent", name: "isParent" },
                      ])
                    : null}
                </div>
                <div className="col-md-4">
                  {userType === "isInstructor"
                    ? this.renderSelect(
                        "linkInstructorId",
                        "Instructor",
                        this.state.instructors
                      )
                    : null}

                  {userType === "isStudent"
                    ? this.renderSelect(
                        "linkStudentId",
                        "Student",
                        this.state.students
                      )
                    : null}

                  {userType === "isParent"
                    ? this.renderSelect(
                        "linkStudentId",
                        "Student",
                        this.state.students
                      )
                    : null}
                </div>
              </div>
              <div className="text-right border-top">
                {this.state.saveRecord === true
                  ? this.renderButton("Save")
                  : null}
                {this.renderLink("/users", "Exit")}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default UserForm;
