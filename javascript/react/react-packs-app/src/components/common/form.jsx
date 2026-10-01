import React, { Component } from "react";
import { Link } from "react-router-dom";
import Joi from "joi-browser";
import Input from "./input";
import Select from "./select";
import Textarea from "./textarea";

import "react-datepicker/dist/react-datepicker.css";


// ============================================================
// GENERIC FORM COMPONENT
// ============================================================
//
// This is the base class used by forms throughout the
// application.
//
// It provides reusable functionality for:
//
// - Form validation
// - Individual field validation
// - Form submission
// - Input changes
// - Buttons
// - Inputs
// - Select fields
// - Textareas
// - Read-only fields
// - Links
//
// STEP 6 - COURSE TIME VALIDATION EXTENSION:
//
// Previously, validate() only performed Joi schema validation.
//
// Joi is very useful for validating individual values such as:
//
// - required fields
// - minimum/maximum lengths
// - numbers
// - dates
// - regular-expression formats
//
// However, some forms need additional validation involving
// the RELATIONSHIP between multiple fields.
//
// For example, ProductForm now contains:
//
// startTime = "08:00"
// endTime   = "17:00"
//
// Both values can individually be valid HH:mm strings, but the
// following schedule must still be rejected:
//
// startTime = "17:00"
// endTime   = "08:00"
//
// To support this without putting Product-specific logic into
// this generic Form class, validate() now optionally calls:
//
// this.validateRelationships()
//
// A child form such as ProductForm can define that method when
// it needs additional cross-field validation.
//
// Forms that do NOT define validateRelationships() continue to
// work exactly as before.
// ============================================================

class Form extends Component {
  state = {
    data: {},
    errors: {},
  };


  // ==========================================================
  // VALIDATE COMPLETE FORM
  // ==========================================================
  //
  // This method validates the ENTIRE form.
  //
  // It is used in at least two important places:
  //
  // 1. renderButton()
  //
  //    Determines whether a form button should be disabled.
  //
  // 2. handleSubmit()
  //
  //    Prevents doSubmit() from running when validation errors
  //    exist.
  //
  //
  // STEP 6 CHANGE:
  //
  // Previously this method returned immediately when Joi found
  // no errors:
  //
  //     if (!error) return null;
  //
  // We can no longer return at that point because Joi may find
  // no errors while a child form's cross-field validation DOES
  // find an error.
  //
  // Example:
  //
  //     startTime = "17:00"
  //     endTime   = "08:00"
  //
  // Both strings individually pass the Joi HH:mm rules.
  //
  // ProductForm must still be given an opportunity to report
  // that End Time is earlier than Start Time.
  //
  // Therefore this method now:
  //
  // 1. Creates an empty errors object.
  // 2. Adds any Joi errors.
  // 3. Optionally asks the child form for relationship errors.
  // 4. Combines both sets of errors.
  // 5. Returns null only if NO errors exist.
  // ==========================================================

  validate = () => {
    // --------------------------------------------------------
    // STEP 1: PERFORM NORMAL JOI VALIDATION
    // --------------------------------------------------------
    //
    // abortEarly: false tells Joi:
    //
    // "Do not stop after finding the first error. Continue
    // validating so that we can collect all errors."
    //
    // This preserves the behavior of the original Form class.

    const options = {
      abortEarly: false,
    };


    // Validate all current form data against the schema defined
    // by the child form.
    //
    // For example, ProductForm supplies its own:
    //
    // this.schema
    //
    // containing rules for Course Name, dates, times, etc.

    const { error } = Joi.validate(
      this.state.data,
      this.schema,
      options
    );


    // Keep the existing debugging output.
    console.log(
      "here in form - validate : error",
      error
    );


    // --------------------------------------------------------
    // STEP 2: CREATE ONE COMMON ERRORS OBJECT
    // --------------------------------------------------------
    //
    // Previously this object was created only if Joi returned
    // an error.
    //
    // It is now created immediately because it will potentially
    // contain TWO categories of errors:
    //
    // 1. Joi errors.
    // 2. Relationship errors supplied by the child form.

    const errors = {};


    // --------------------------------------------------------
    // STEP 3: ADD JOI ERRORS
    // --------------------------------------------------------
    //
    // Joi's error object contains an array called details.
    //
    // Each item represents a validation error.
    //
    // item.path[0]
    //
    // identifies the form field.
    //
    // item.message
    //
    // contains the corresponding validation message.
    //
    // Example:
    //
    // errors["startTime"] =
    //   '"Start Time" is not allowed to be empty';
    //
    // We only loop when Joi actually returned an error.

    if (error) {
      for (let item of error.details) {
        errors[item.path[0]] = item.message;
      }
    }


    // --------------------------------------------------------
    // STEP 4: OPTIONAL CROSS-FIELD / RELATIONSHIP VALIDATION
    // --------------------------------------------------------
    //
    // Some forms need validation rules that compare multiple
    // fields.
    //
    // The generic Form class should NOT know about specific
    // Product fields such as:
    //
    // startTime
    // endTime
    //
    // Otherwise Form would become coupled to ProductForm.
    //
    // Instead, a child form can optionally define:
    //
    // validateRelationships = () => {
    //   ...
    // };
    //
    // We first check whether that function exists.
    //
    // This is important because most existing forms probably do
    // not define validateRelationships().
    //
    // If the method does not exist, nothing happens and those
    // forms continue using ordinary Joi validation exactly as
    // before.

    if (
      typeof this.validateRelationships === "function"
    ) {
      // Ask the child form to perform its additional validation.
      //
      // ProductForm will return an object such as:
      //
      // {
      //   endTime:
      //     "End Time needs to be after Start Time"
      // }
      //
      // or an empty object when no relationship error exists.

      const relationshipErrors =
        this.validateRelationships();


      // ------------------------------------------------------
      // MERGE RELATIONSHIP ERRORS INTO THE MAIN ERRORS OBJECT
      // ------------------------------------------------------
      //
      // Object.assign() copies properties from the second object
      // into the first.
      //
      // Example:
      //
      // Joi errors:
      //
      // {
      //   name: '"Course Name" is required'
      // }
      //
      // Relationship errors:
      //
      // {
      //   endTime:
      //     "End Time needs to be after Start Time"
      // }
      //
      // Result:
      //
      // {
      //   name: '"Course Name" is required',
      //   endTime:
      //     "End Time needs to be after Start Time"
      // }
      //
      // The fallback || {} provides extra safety in case a
      // child implementation returns null or undefined.

      Object.assign(
        errors,
        relationshipErrors || {}
      );
    }


    // --------------------------------------------------------
    // STEP 5: RETURN FINAL VALIDATION RESULT
    // --------------------------------------------------------
    //
    // The rest of this Form class expects:
    //
    // null
    //
    // when the complete form is valid.
    //
    // It expects an errors object when the form is invalid.
    //
    // Object.keys(errors) returns all property names contained
    // in the errors object.
    //
    // Example:
    //
    // {}
    //
    // Object.keys(errors).length === 0
    //
    // therefore:
    //
    // return null
    //
    //
    // But:
    //
    // {
    //   endTime:
    //     "End Time needs to be after Start Time"
    // }
    //
    // has one key, so we return the errors object.

    return Object.keys(errors).length === 0
      ? null
      : errors;
  };


  // ==========================================================
  // VALIDATE ONE PROPERTY
  // ==========================================================
  //
  // This method validates ONE input field when the user changes
  // it.
  //
  // For example, if the user changes startTime, this validates
  // startTime against:
  //
  // this.schema.startTime
  //
  // It does NOT perform cross-field validation because it only
  // receives one field.
  //
  // ProductForm's componentDidUpdate() handles immediate
  // Start Time / End Time relationship feedback.
  // ==========================================================

  validateProperty = ({ name, value }) => {
    // Create a temporary object containing only the changed
    // field.
    //
    // Example:
    //
    // {
    //   startTime: "08:00"
    // }

    const obj = {
      [name]: value,
    };


    // Create a temporary Joi schema containing only the rule
    // belonging to this field.

    const schema = {
      [name]: this.schema[name],
    };


    // Validate only this property.

    const { error } = Joi.validate(
      obj,
      schema
    );


    // Return the first validation error message when one exists.
    //
    // Otherwise return null.

    return error
      ? error.details[0].message
      : null;
  };


  // ==========================================================
  // HANDLE FORM SUBMISSION
  // ==========================================================
  //
  // This method runs when the user submits the form.
  //
  // It performs COMPLETE validation before allowing the child
  // form's doSubmit() method to execute.
  //
  // Because validate() now includes both Joi errors and optional
  // relationship errors, cross-field errors also prevent the
  // form from being submitted.
  // ==========================================================

  handleSubmit = (e) => {
    // Prevent the browser's normal HTML form submission.
    //
    // Without this, the browser would reload the page.
    e.preventDefault();


    // Validate the entire form.
    //
    // This now includes:
    //
    // - Joi schema validation
    // - optional child-form relationship validation

    const errors = this.validate();


    // Put the returned errors into state so that the relevant
    // Input components can display them.
    //
    // When validate() returns null, store an empty object.

    this.setState({
      errors: errors || {},
    });


    // If validation returned an errors object, stop here.
    //
    // doSubmit() must NOT contact the server while the form is
    // invalid.

    if (errors) return;


    // Everything passed validation.
    //
    // Call the child form's submission method.

    this.doSubmit();
  };


  // ==========================================================
  // HANDLE GENERIC BUTTON CLICK
  // ==========================================================

  handleClick = () => {
    this.doClick();
  };


  // ==========================================================
  // HANDLE INPUT CHANGE
  // ==========================================================
  //
  // Destructured e which is input event.
  //
  // This method is called whenever a form field changes.
  //
  // It performs validation for the INDIVIDUAL changed field.
  //
  // Cross-field relationship validation is not performed here.
  //
  // For ProductForm, immediate Start Time / End Time
  // relationship feedback is handled by componentDidUpdate().
  // ==========================================================

  handleChange = ({ currentTarget: input }) => {
    // Copy the current errors object.
    //
    // React state should not be directly mutated.

    const errors = {
      ...this.state.errors,
    };


    // Validate only the field that just changed.

    const errorMessage =
      this.validateProperty(input);


    // If the field has a validation error, store it using the
    // field name as the key.
    //
    // Otherwise remove any previous error for this field.

    if (errorMessage) {
      errors[input.name] = errorMessage;
    } else {
      delete errors[input.name];
    }


    // Copy the existing form data.

    const data = {
      ...this.state.data,
    };


    // Update the changed field.
    //
    // Example:
    //
    // data["startTime"] = "08:00";

    data[input.name] = input.value;


    // Store the new form data and errors in state.

    this.setState({
      data,
      errors,
    });
  };


  // ==========================================================
  // RENDER BUTTON
  // ==========================================================
  //
  // This renders a standard form button.
  //
  // IMPORTANT:
  //
  // disabled={this.validate()}
  //
  // means the complete form validation result controls whether
  // this button is enabled.
  //
  // validate() returns:
  //
  // null
  //     -> no validation errors
  //     -> disabled receives null/falsy
  //     -> button is enabled
  //
  // errors object
  //     -> validation failed
  //     -> disabled receives a truthy object
  //     -> button is disabled
  //
  // Because validate() now includes relationship validation,
  // ProductForm's Save button will remain disabled for:
  //
  // Start Time: 17:00
  // End Time:   08:00
  //
  // even though both strings individually pass Joi's HH:mm
  // format validation.
  // ==========================================================

  renderButton(label) {
    return (
      <button
        disabled={this.validate()}
        className="btn btn-primary mt-2 mr-2"
      >
        {label}
      </button>
    );
  }


  // ==========================================================
  // RENDER RETURN BUTTON
  // ==========================================================
  //
  // DA Added this for the return button as there is no
  // validation to be done and the button needs to be active.
  // ==========================================================

  renderReturnButton(label) {
    return (
      <button
        onClick={this.handleClick}
        className="btn btn-primary mt-2 mr-2"
      >
        {label}
      </button>
    );
  }


  // ==========================================================
  // RENDER SELECT
  // ==========================================================

  renderSelect(name, label, options) {
    const {
      data,
      errors,
    } = this.state;

    return (
      <Select
        name={name}
        value={data[name]}
        label={label}
        options={options}
        onChange={this.handleChange}
        error={errors[name]}
      />
    );
  }


  // ==========================================================
  // RENDER INPUT
  // ==========================================================
  //
  // type defaults to "text".
  //
  // ProductForm can therefore call:
  //
  // this.renderInput(
  //   "startTime",
  //   "Start Time",
  //   "time"
  // )
  //
  // which ultimately produces an HTML time input.
  // ==========================================================

  renderInput(name, label, type = "text") {
    const {
      data,
      errors,
    } = this.state;

    return (
      <Input
        className="form-control"
        type={type}
        name={name}
        label={label}
        value={data[name]}
        onChange={this.handleChange}
        error={errors[name]}
      />
    );
  }


  // ==========================================================
  // RENDER TEXTAREA
  // ==========================================================
  //
  // DA 15 05 2023
  // Added textarea for multiple lines input fields.
  // ==========================================================

  renderTextarea(
    name,
    label,
    type = "text",
    rows
  ) {
    const {
      data,
      errors,
    } = this.state;

    return (
      <Textarea
        className="form-control"
        rows={rows}
        type={type}
        name={name}
        label={label}
        value={data[name]}
        onChange={this.handleChange}
        error={errors[name]}
      />
    );
  }


  // ==========================================================
  // RENDER READ-ONLY INPUT
  // ==========================================================
  //
  // DA 25 02 2023
  // Added Readonly to only display data.
  // ==========================================================

  renderInputReadOnly(
    name,
    label,
    type = "text"
  ) {
    const {
      data,
      errors,
    } = this.state;

    return (
      <Input
        className="form-control"
        type={type}
        name={name}
        value={data[name]}
        label={label}
        error={errors[name]}
        readOnly="readonly"
      />
    );
  }


  // ==========================================================
  // RENDER STATE PROPERTY AS READ-ONLY
  // ==========================================================
  //
  // DA 16 05 2023
  // Added to display value without looking at state value.
  // ==========================================================

  renderStatePropertyReadOnly(
    value,
    name,
    label,
    type = "text"
  ) {
    const {
      errors,
    } = this.state;

    return (
      <Input
        className="form-control"
        type={type}
        name={name}
        value={value}
        label={label}
        error={errors[name]}
        readOnly="readonly"
      />
    );
  }


  // ==========================================================
  // RENDER MASKED PASSWORD AS READ-ONLY
  // ==========================================================
  //
  // DA 25 02 2023
  // Added Password Mask Readonly to only display data.
  // ==========================================================

  renderMaskPasswordReadOnly(
    name,
    label,
    type = "password"
  ) {
    const {
      data,
      errors,
    } = this.state;

    return (
      <Input
        className="form-control"
        type={type}
        name={name}
        value={data[name]}
        label={label}
        error={errors[name]}
        readOnly="readonly"
      />
    );
  }


  // ==========================================================
  // RENDER BOOLEAN SELECT
  // ==========================================================
  //
  // DA 25 02 20023
  // Added Select for Boolean isGold; can be used for future
  // option inputs.
  // ==========================================================

  renderUseSelect(name, label) {
    const {
      data,
      errors,
    } = this.state;

    return (
      <Input
        name={name}
        value={data[name]}
        label={label}
        options={[
          {
            value: false,
            label: "False",
          },
          {
            value: true,
            label: "True",
          },
        ]}
        useSelect="true"
        onChange={this.handleChange}
        error={errors[name]}
      />
    );
  }


  // ==========================================================
  // RENDER LINK
  // ==========================================================
  //
  // DA 08 03 2023
  // Added link to be called on forms in the application.
  // ==========================================================

  renderLink(to, label) {
    return (
      <Link
        to={to}
        className="btn btn-primary mt-2 mr-2"
      >
        {label}
      </Link>
    );
  }
}

export default Form;