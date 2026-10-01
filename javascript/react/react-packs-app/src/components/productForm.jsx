import React from "react";
import { toast } from "react-toastify";

import Joi from "joi-browser";

import Form from "./common/form";

import { getInstructors } from "../services/instructorService";
import {
  getProduct,
  saveProduct,
} from "../services/productService";


// ============================================================
// COURSE TIME FORMAT
// ============================================================
//
// Courses store their daily start and end times as strings
// using the 24-hour HH:mm format.
//
// Valid examples:
//
// "00:00"
// "08:00"
// "13:30"
// "17:00"
// "23:59"
//
// Invalid examples:
//
// "8:00"   -> hour is not zero-padded
// "25:00"  -> hour cannot be greater than 23
// "08:75"  -> minutes cannot be greater than 59
//
// REGEX EXPLANATION:
//
// ^                 Start of string
//
// ([01]\d|2[0-3])   Hours:
//                    00-19 OR 20-23
//
// :                 Literal colon
//
// ([0-5]\d)         Minutes:
//                    00-59
//
// $                 End of string
//
// This same HH:mm structure also allows us to compare two
// valid time strings directly later:
//
// "17:00" > "08:00"  -> true
//
// because both hours and minutes are always zero-padded.
// ============================================================

const timePattern =
  /^([01]\d|2[0-3]):([0-5]\d)$/;


// ============================================================
// PRODUCT / COURSE FORM
// ============================================================
//
// This component is used for both:
//
// 1. Creating a new Course.
// 2. Editing an existing Course.
//
// CALENDAR EVENT TIME EXTENSION:
//
// Courses contain:
//
// startDate
// endDate
// startTime
// endTime
//
// Example:
//
// startDate = 2026-10-01
// endDate   = 2026-10-31
// startTime = "08:00"
// endTime   = "17:00"
//
// This represents a Course scheduled from 08:00 until 17:00
// on each calendar day from 1 October through 31 October.
//
// STEP 6:
//
// Step 6 adds frontend validation for the Course scheduling
// times.
//
// The form now checks:
//
// 1. Start Time has been provided.
// 2. End Time has been provided.
// 3. Start Time uses valid HH:mm format.
// 4. End Time uses valid HH:mm format.
// 5. End Time is strictly later than Start Time.
//
// Example:
//
// 08:00 -> 17:00    VALID
// 08:00 -> 08:00    INVALID
// 17:00 -> 08:00    INVALID
//
// Overnight Courses are NOT supported.
// ============================================================

class ProductForm extends Form {

  // ==========================================================
  // COMPONENT STATE
  // ==========================================================
  //
  // data contains the values represented by the Course form.
  //
  // The Form base class handles updating these properties when
  // the corresponding input values change.
  // ==========================================================

  state = {
    data: {
      name: "",
      productCode: "",
      instructorId: "",
      numberInStock: "",

      // ------------------------------------------------------
      // COURSE DATE RANGE
      // ------------------------------------------------------

      startDate: "",
      endDate: "",


      // ------------------------------------------------------
      // DAILY COURSE SCHEDULING TIMES
      // ------------------------------------------------------
      //
      // These values are stored as HH:mm strings.
      //
      // Examples:
      //
      // startTime = "08:00"
      // endTime   = "17:00"
      //
      // The values come from HTML <input type="time">
      // controls rendered later in this component.

      startTime: "",
      endTime: "",


      productPrice: "",
      active: false,
    },

    // List of available instructors used by the Instructor
    // select field.
    instructors: [],

    // Validation errors displayed by the Form base class.
    errors: {},
  };


  // ==========================================================
  // JOI VALIDATION SCHEMA
  // ==========================================================
  //
  // Joi handles validation of the INDIVIDUAL form fields.
  //
  // For the two scheduling fields, Joi checks:
  //
  // - A value is provided.
  // - The value matches HH:mm.
  //
  // Joi does NOT perform our Course-specific relationship
  // comparison here:
  //
  // endTime > startTime
  //
  // That relationship is handled by:
  //
  // validateRelationships()
  //
  // The generic Form.validate() method now combines the errors
  // returned here by Joi with the errors returned by
  // validateRelationships().
  // ==========================================================

  schema = {
    _id: Joi.string(),

    name: Joi.string()
      .required()
      .min(5)
      .label("Course Name"),

    description: Joi.string()
      .required()
      .min(15)
      .max(3000)
      .label("Description"),

    productCode: Joi.string()
      .required()
      .min(4)
      .max(7)
      .label("Course Code"),

    instructorId: Joi.string()
      .required()
      .label("Instructor"),

    numberInStock: Joi.number()
      .min(0)
      .max(9999)
      .required()
      .label("Spaces"),


    // --------------------------------------------------------
    // COURSE DATES
    // --------------------------------------------------------

    startDate: Joi.date()
      .iso()
      .required()
      .label("Start Date"),

    endDate: Joi.date()
      .iso()
      .required()
      .label("End Date")
      .greater(Joi.ref("startDate")),


    // --------------------------------------------------------
    // COURSE DAILY TIMES
    // --------------------------------------------------------
    //
    // .required()
    //
    // makes sure the user supplies a value.
    //
    // .regex(timePattern)
    //
    // makes sure the supplied value follows valid 24-hour
    // HH:mm format.
    //
    // Examples:
    //
    // "08:00" -> valid
    // "17:30" -> valid
    // "25:00" -> invalid
    // "08:99" -> invalid

    startTime: Joi.string()
      .regex(timePattern)
      .required()
      .label("Start Time"),

    endTime: Joi.string()
      .regex(timePattern)
      .required()
      .label("End Time"),


    productPrice: Joi.number()
      .required()
      .min(99)
      .max(999999)
      .label("Product Price"),

    active: Joi.boolean()
      .label("Active"),
  };


  // ==========================================================
  // COURSE RELATIONSHIP VALIDATION
  // ==========================================================
  //
  // NEW / AMENDED FOR STEP 6.
  //
  // IMPORTANT:
  //
  // ProductForm NO LONGER overrides validate().
  //
  // Previously we attempted:
  //
  // validate = () => {
  //   const errors = super.validate();
  //   ...
  // };
  //
  // That caused:
  //
  // TypeError: super.validate is not a function
  //
  // because Form defines validate as a class-field arrow
  // function:
  //
  // validate = () => { ... };
  //
  // rather than as a normal prototype method:
  //
  // validate() { ... }
  //
  // The updated Form class now owns the complete validation
  // process and optionally calls:
  //
  // this.validateRelationships()
  //
  // when a child form provides that function.
  //
  // ProductForm therefore only needs to describe its
  // Product-specific CROSS-FIELD validation here.
  //
  //
  // WHY IS THIS SEPARATE FROM JOI?
  //
  // Joi validates each time field individually.
  //
  // For example:
  //
  // startTime = "17:00"
  // endTime   = "08:00"
  //
  // Both are individually valid HH:mm strings.
  //
  // Therefore:
  //
  // timePattern.test("17:00") -> true
  // timePattern.test("08:00") -> true
  //
  // But together they represent an invalid Course schedule,
  // because the Course ends before it starts.
  //
  // That relationship is what this method validates.
  //
  //
  // HOW IS THIS METHOD USED?
  //
  // We do NOT need to call it ourselves here.
  //
  // The updated Form.validate() method automatically checks:
  //
  // typeof this.validateRelationships === "function"
  //
  // and calls this method when it exists.
  //
  // Its errors are then merged with the normal Joi errors.
  //
  // Consequently the same complete validation result controls:
  //
  // - whether the Save button is disabled
  // - whether handleSubmit() permits doSubmit()
  //
  // ==========================================================

  validateRelationships = () => {
    // Create an empty object that will contain any
    // Product-specific relationship errors.

    const errors = {};


    // Get the current daily Course scheduling times.

    const {
      startTime,
      endTime,
    } = this.state.data;


    // --------------------------------------------------------
    // CHECK THE RELATIONSHIP ONLY WHEN BOTH TIMES ARE VALID
    // --------------------------------------------------------
    //
    // Missing or malformed values are already handled by Joi.
    //
    // Example:
    //
    // startTime = ""
    // endTime   = "17:00"
    //
    // Joi should report that Start Time is required.
    //
    // There is no reason to also produce a relationship error
    // involving an empty value.
    //
    // We therefore perform the comparison only after both
    // strings successfully match the HH:mm pattern.

    if (
      timePattern.test(startTime) &&
      timePattern.test(endTime) &&
      endTime <= startTime
    ) {
      // Attach the relationship error to End Time.
      //
      // We use <= rather than < because the Course must end
      // STRICTLY later than it starts.
      //
      // Therefore:
      //
      // 08:00 -> 17:00    VALID
      // 08:00 -> 08:01    VALID
      //
      // 08:00 -> 08:00    INVALID
      // 17:00 -> 08:00    INVALID
      // 22:00 -> 06:00    INVALID
      //
      // The final example would be an overnight Course, which
      // this feature deliberately does not support.

      errors["endTime"] =
        "End Time needs to be after Start Time";
    }


    // Return the Product-specific errors.
    //
    // When the relationship is valid this is simply:
    //
    // {}
    //
    // Form.validate() combines this object with any Joi errors.

    return errors;
  };


  // ==========================================================
  // POPULATE INSTRUCTORS
  // ==========================================================
  //
  // Called from componentDidMount().
  //
  // Retrieves the available Instructors for the Instructor
  // selection field.
  // ==========================================================

  async populateInstructors() {
    const {
      data: instructors,
    } = await getInstructors();

    this.setState({
      instructors,
    });
  }


  // ==========================================================
  // POPULATE PRODUCT
  // ==========================================================
  //
  // Called from componentDidMount().
  //
  // When editing an existing Course, retrieve it from the
  // backend and convert it into the structure expected by
  // this form.
  //
  // If the URL contains "new", there is no existing Product
  // to retrieve.
  // ==========================================================

  async populateProduct() {
    try {
      const productId =
        this.props.match.params.id;

      // Creating a new Course rather than editing an existing
      // one.
      if (productId === "new") return;


      // Retrieve the existing Course.
      const {
        data: product,
      } = await getProduct(productId);


      // Convert the server Product into the format expected by
      // the form and store it in state.
      this.setState({
        data: this.mapToViewModel(product),
      });

    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;

        case 500:
          toast.error(ex.response.data);
          break;

        default:
          toast.error(
            "ProductForm : Unspecified Error Occured"
          );
      }

      this.props.history.replace(
        "/not-found"
      );
    }
  }


  // ==========================================================
  // COMPONENT DID MOUNT
  // ==========================================================
  //
  // First load Instructors, then load the Product if this is
  // an edit operation.
  // ==========================================================

  async componentDidMount() {
    await this.populateInstructors();

    await this.populateProduct();
  }


  // ==========================================================
  // DATE AND TIME RELATIONSHIP VALIDATION
  // ==========================================================
  //
  // componentDidUpdate() provides IMMEDIATE VISUAL feedback
  // when the user changes related fields.
  //
  // There are TWO relationship checks:
  //
  // 1. End Date must be after Start Date.
  //
  // 2. End Time must be after Start Time.
  //
  //
  // IMPORTANT DISTINCTION:
  //
  // validateRelationships()
  //
  //     -> contributes the Course-specific cross-field rule to
  //        Form.validate()
  //
  //     -> keeps the Save button disabled
  //
  //     -> prevents submission
  //
  //
  // componentDidUpdate()
  //
  //     -> manages immediate visible feedback in state.errors
  //
  //     -> displays the End Time error below the field
  //
  //     -> displays the toast warning
  //
  //
  // The two pieces therefore enforce the same business rule
  // for different purposes.
  // ==========================================================

  componentDidUpdate(prevProps, prevState) {

    // ========================================================
    // PART 1: DATE RELATIONSHIP VALIDATION
    // ========================================================
    //
    // DA 31 03 2023
    //
    // Existing validation:
    //
    // End Date must be after Start Date.
    //
    // Only run this block if one of the date values actually
    // changed.
    //
    // This is also important because this block calls
    // setState().
    //
    // componentDidUpdate() runs again after setState(), but
    // during that second update the date values have not
    // changed, so this block does not execute again.

    if (
      prevState.data.endDate !==
        this.state.data.endDate ||
      prevState.data.startDate !==
        this.state.data.startDate
    ) {
      const {
        startDate,
        endDate,
      } = this.state.data;


      // Copy the current errors rather than directly modifying
      // this.state.errors.

      const errors = {
        ...this.state.errors,
      };


      // The Course must end after it starts.

      if (
        new Date(endDate) <=
        new Date(startDate)
      ) {
        toast.warning(
          "End Date needs to be after Start Date"
        );

        errors["endDate"] =
          "End Date needs to be after Start Date";

      } else {
        // If the relationship becomes valid again, remove the
        // old End Date relationship error.

        delete errors["endDate"];
      }


      // Store the updated errors object in state.

      this.setState({
        errors,
      });
    }


    // ========================================================
    // PART 2: COURSE TIME RELATIONSHIP VALIDATION
    // ========================================================
    //
    // Run this block only when Start Time or End Time changes.
    //
    // Example:
    //
    // Previous:
    //
    // startTime = "08:00"
    // endTime   = "17:00"
    //
    // User changes Start Time:
    //
    // startTime = "18:00"
    // endTime   = "17:00"
    //
    // This condition becomes true and the relationship is
    // checked.
    //
    // Checking whether the actual time values changed also
    // prevents a setState() loop.
    //
    // setState({ errors }) causes componentDidUpdate() to run
    // again, but that second update changes only errors, not
    // the time values.

    if (
      prevState.data.startTime !==
        this.state.data.startTime ||
      prevState.data.endTime !==
        this.state.data.endTime
    ) {
      // Get the CURRENT time values from state.

      const {
        startTime,
        endTime,
      } = this.state.data;


      // Make a copy of the current errors object.
      //
      // We modify this copy and then use setState() rather than
      // directly mutating this.state.errors.

      const errors = {
        ...this.state.errors,
      };


      // ------------------------------------------------------
      // CHECK EACH TIME'S FORMAT
      // ------------------------------------------------------
      //
      // .test() returns true if the supplied string matches
      // timePattern.
      //
      // Example:
      //
      // timePattern.test("08:00") -> true
      //
      // timePattern.test("25:00") -> false

      const startTimeIsValid =
        timePattern.test(startTime);

      const endTimeIsValid =
        timePattern.test(endTime);


      // ------------------------------------------------------
      // CROSS-FIELD TIME RELATIONSHIP CHECK
      // ------------------------------------------------------
      //
      // Only compare Start Time and End Time when BOTH already
      // contain valid HH:mm values.
      //
      // If either value is missing or malformed, Joi /
      // validateProperty() handles that individual field error.

      if (
        startTimeIsValid &&
        endTimeIsValid
      ) {
        // ----------------------------------------------------
        // END TIME MUST BE STRICTLY LATER THAN START TIME
        // ----------------------------------------------------
        //
        // Because valid values are always zero-padded HH:mm
        // strings, lexical comparison works correctly.
        //
        // Examples:
        //
        // "17:00" > "08:00" -> true
        //
        // The invalid condition is:
        //
        // endTime <= startTime
        //
        // Using <= means equal times are invalid too.
        //
        // VALID:
        //
        // 08:00 -> 17:00
        // 08:00 -> 08:01
        //
        // INVALID:
        //
        // 17:00 -> 08:00
        // 08:00 -> 08:00
        // 22:00 -> 06:00
        //
        // The final example represents an overnight Course,
        // which this feature deliberately does not support.

        if (endTime <= startTime) {
          // Show an immediate warning to the user.

          toast.warning(
            "End Time needs to be after Start Time"
          );


          // Add the relationship error to the End Time field.
          //
          // The Input component can therefore display this
          // message underneath the End Time input.

          errors["endTime"] =
            "End Time needs to be after Start Time";

        } else {
          // The relationship is now valid.
          //
          // Remove the previous relationship error.

          delete errors["endTime"];
        }

      } else {
        // ----------------------------------------------------
        // ONE OR BOTH TIME VALUES ARE NOT VALID HH:mm
        // ----------------------------------------------------
        //
        // In this situation we should NOT compare them.
        //
        // For example:
        //
        // startTime = "08:00"
        // endTime   = ""
        //
        // The appropriate individual field error is handled by
        // Joi / validateProperty().
        //
        // Remove ONLY our old cross-field relationship error.
        //
        // We deliberately check the message before deleting it
        // so that we do not accidentally remove a different
        // End Time validation error.

        if (
          errors["endTime"] ===
          "End Time needs to be after Start Time"
        ) {
          delete errors["endTime"];
        }
      }


      // Store the updated errors object.

      this.setState({
        errors,
      });
    }
  }


  // ==========================================================
  // MAP SERVER PRODUCT TO FORM DATA
  // ==========================================================
  //
  // You can remap data models from server to the display
  // component.
  //
  // This method is particularly important when EDITING an
  // existing Course.
  //
  // The Product returned by the backend is converted into the
  // structure expected by this.state.data.
  // ==========================================================

  mapToViewModel(product) {
    // Convert the MongoDB date values into JavaScript Dates.

    const startDate =
      new Date(product.startDate);

    const endDate =
      new Date(product.endDate);


    return {
      _id: product._id,

      name: product.name,

      description: product.description,

      productCode: product.productCode,

      instructorId:
        product.instructor._id,

      numberInStock:
        product.numberInStock,


      // ------------------------------------------------------
      // COURSE DATES
      // ------------------------------------------------------
      //
      // Preserve the application's existing date conversion.

      startDate:
        startDate.toISOString(),

      endDate:
        endDate.toISOString(),


      // ------------------------------------------------------
      // COURSE DAILY TIMES
      // ------------------------------------------------------
      //
      // Load the Product's stored scheduling times into the
      // form when editing an existing Course.
      //
      // The || "" fallback is currently useful because old
      // Product records have not yet been migrated.
      //
      // An old Product without startTime/endTime therefore
      // produces empty controls rather than undefined values.
      //
      // After the migration phase, existing Products will be
      // backfilled with:
      //
      // startTime = "08:00"
      // endTime   = "17:00"

      startTime:
        product.startTime || "",

      endTime:
        product.endTime || "",


      // Decimal128 is returned from MongoDB using the
      // $numberDecimal representation.

      productPrice:
        product.productPrice.$numberDecimal,

      active:
        product.active,
    };
  }


  // ==========================================================
  // SUBMIT COURSE
  // ==========================================================
  //
  // saveProduct() receives the entire data object.
  //
  // Because startTime and endTime exist in data, they are
  // automatically included in the object passed to the
  // Product service.
  //
  // Before doSubmit() is reached, Form.handleSubmit() calls
  // Form.validate().
  //
  // Form.validate() now combines:
  //
  // 1. Normal Joi validation.
  //
  // 2. ProductForm.validateRelationships().
  //
  // Therefore a Course with:
  //
  // startTime = "17:00"
  // endTime   = "08:00"
  //
  // is considered invalid and cannot proceed normally to this
  // method.
  // ==========================================================

  doSubmit = async () => {
    // Call the server.
    //
    // this.state.data includes:
    //
    // startTime
    // endTime
    //
    // along with all existing Course fields.

    await saveProduct(
      this.state.data
    );


    // DA 26 02 2023
    // Changed to go to page which called the edit.
    //
    // this.props.history.push("/products");

    this.props.history.goBack();
  };


  // ==========================================================
  // RENDER COURSE FORM
  // ==========================================================

  render() {
    // DA 31 March 2023
    // Added for Date Display on Input Form.

    const {
      startDate,
      endDate,
    } = this.state.data;


    const courseStartDate =
      new Date(
        startDate
      ).toLocaleDateString(
        "en-ZA"
      );

    const courseEndDate =
      new Date(
        endDate
      ).toLocaleDateString(
        "en-ZA"
      );


    return (
      <div>
        <h1>Course</h1>

        <form onSubmit={this.handleSubmit}>
          <div className="row">

            {/* ================================================
                LEFT SIDE OF COURSE FORM
                ================================================ */}

            <div className="col-md-6">
              {this.renderInput(
                "name",
                "Course Name"
              )}

              {this.renderTextarea(
                "description",
                "Description",
                "text",
                "10"
              )}
            </div>


            {/* ================================================
                RIGHT SIDE OF COURSE FORM
                ================================================ */}

            <div className="col-md-6">

              {/* ==============================================
                  COURSE CODE AND INSTRUCTOR
                  ============================================== */}

              <div className="row">
                <div className="col-md-6">
                  {this.renderInput(
                    "productCode",
                    "Course Code"
                  )}
                </div>

                <div className="col-md-6">
                  {this.renderSelect(
                    "instructorId",
                    "Instructor",
                    this.state.instructors
                  )}
                </div>
              </div>


              {/* ==============================================
                  COURSE DATE RANGE
                  ==============================================

                  These fields determine WHICH DAYS the Course
                  takes place.

                  Example:

                  Start Date: 01/10/2026
                  End Date:   31/10/2026
              */}

              <div className="row">
                <div className="col-md-6">
                  {this.renderInput(
                    "startDate",
                    "Start Date : " +
                      courseStartDate,
                    "date"
                  )}
                </div>

                <div className="col-md-6">
                  {this.renderInput(
                    "endDate",
                    "End Date : " +
                      courseEndDate,
                    "date"
                  )}
                </div>
              </div>


              {/* ==============================================
                  DAILY COURSE SCHEDULING TIMES
                  ==============================================

                  These fields determine WHAT TIME the Course
                  takes place on each day in its date range.

                  Example:

                  Start Date: 01/10/2026
                  End Date:   31/10/2026

                  Start Time: 08:00
                  End Time:   17:00

                  This means the Course runs from 08:00 until
                  17:00 on every calendar day from 1 October
                  through 31 October 2026.

                  renderInput() accepts an input type as its
                  third argument.

                  Passing:

                  "time"

                  ultimately creates:

                  <input type="time" />

                  The browser therefore provides the native
                  time-selection control.

                  The selected values are stored in state as
                  HH:mm strings.
              */}

              <div className="row">
                <div className="col-md-6">
                  {this.renderInput(
                    "startTime",
                    "Start Time",
                    "time"
                  )}
                </div>

                <div className="col-md-6">
                  {this.renderInput(
                    "endTime",
                    "End Time",
                    "time"
                  )}
                </div>
              </div>


              {/* ==============================================
                  COURSE PRICE, QUANTITY AND ACTIVE STATUS
                  ============================================== */}

              <div className="row">
                <div className="col-md-4">
                  {this.renderInput(
                    "productPrice",
                    "Fee"
                  )}
                </div>

                <div className="col-md-4">
                  {this.renderInput(
                    "numberInStock",
                    "Quanity"
                  )}
                </div>

                <div className="col-md-4">
                  {this.renderUseSelect(
                    "active",
                    "Active"
                  )}
                </div>
              </div>


              {/* ==============================================
                  FORM ACTIONS
                  ==============================================

                  renderButton("Save") uses Form.validate().

                  Form.validate() now combines:

                  - Joi field validation
                  - ProductForm.validateRelationships()

                  Therefore the Save button remains disabled
                  when:

                  - Start Time is missing.
                  - End Time is missing.
                  - Either time has invalid HH:mm format.
                  - End Time is equal to Start Time.
                  - End Time is earlier than Start Time.
                  - Any other existing Course field is invalid.
              */}

              <div className="text-right border-top">
                {this.renderButton("Save")}

                {this.renderButton("Print")}

                {this.renderLink(
                  "/products",
                  "Exit"
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default ProductForm;