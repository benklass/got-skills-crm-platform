import React from "react";

import { Link } from "react-router-dom";

import { toast } from "react-toastify";

import Joi from "joi-browser";

import Form from "./common/form";

import { getCustomers } from "../services/customerService";

import { getProducts } from "../services/productService";

import {

  saveEnrollment,

  getEnrollmentsByCustomerId,

} from "../services/enrollmentService";

class EnrollmentForm extends Form {

  // ========================================================

  // STEP 14:

  // CONFLICT-CHECK REQUEST VERSION

  // ========================================================

  //

  // The Student or Course selection can change while an older

  // asynchronous conflict request is still running.

  //

  // Each conflict check receives an incrementing request ID.

  // If an older request finishes after a newer request has begun,

  // its result is ignored so it cannot overwrite the warning for

  // the latest Student/Course selection.

  conflictCheckRequestId = 0;

  state = {

    data: {

      customerId: "",

      phone: "",

      productId: "",

      startDate: "",

      endDate: "",

      // STEP 14 UI improvement:

      // Show the selected Course's daily time range alongside

      // its date range.

      startTime: "",

      endTime: "",

      productPrice: "",

    },

    customers: [],

    // Courses available in the Course dropdown.

    //

    // This list keeps the application's existing behavior:

    // only active Courses with available stock are selectable.

    products: [],

    // ======================================================

    // STEP 14:

    // COMPLETE CURRENT COURSE LIST

    // ======================================================

    //

    // Conflict detection cannot rely only on "products" because

    // an existing Enrollment may refer to a Course that is now

    // inactive or has no remaining stock.

    //

    // allProducts therefore stores every current Course returned

    // by getProducts().

    allProducts: [],

    // Existing Enrollment records belonging to the currently

    // selected Student.

    studentEnrollments: [],

    // Any existing Course schedules that conflict with the newly

    // selected Course.

    scheduleConflicts: [],

    // true while Enrollment/schedule data is being retrieved and

    // compared.

    conflictChecking: false,

    // Conflict-check failures are deliberately kept separate from

    // normal Joi form-validation errors.

    //

    // A failure to retrieve conflict data must NOT silently be

    // interpreted as confirmation that no conflict exists.

    conflictCheckError: "",

    enrollmentDate: "",

    enrollmentFee: "",

    enrollmentId: "",

    errors: {},

  };

  // Validation using Joi for new enrollment

  schema = {

    _id: Joi.string(),

    customerId: Joi.string().required().label("Customer"),

    productId: Joi.string().required().label("Course"),

    course: Joi.string(),

    productPrice: Joi.number()

      .integer()

      .required()

      .min(0)

      .max(99999)

      .label("Course Fee"),

    phone: Joi.string()

      .min(7)

      .max(16)

      .regex(/^(\d{3}-\d{3}-\d{4}$)/, "Number format 999-999-9999 ")

      .required()

      .label("Phone"),

    startDate: Joi.date().required().label("Start Date"),

    endDate: Joi.date().required().label("End Date"),

    // STEP 14 UI improvement:

    // These values come from the selected Product and are displayed

    // read-only on the Enrollment form.

    startTime: Joi.string().required().label("Start Time"),

    endTime: Joi.string().required().label("End Time"),

  };

  // called from componentDidMount

  async populateCustomers() {

    const { data: customers } = await getCustomers();

    this.setState({ customers });

  }

  // called from componentDidMount

  async populateProducts() {

    // Retrieve ALL current Course/Product records.

    const { data: products } = await getProducts();

    // DA 1 March 2023 added map to [name] for form and validation to work

    // DA 6 March 2023 added filter to exclude movies out of stock

    //

    // Preserve the existing Course-dropdown behavior:

    // - at least one place must be available

    // - Course must be active

    const updatedProducts = products

      .filter((product) => product.numberInStock >= 1 && product.active)

      .map((product) => {

        return {

          ...product,

          course: product.name,

        };

      });

    // ======================================================

    // STEP 14:

    // STORE BOTH COURSE COLLECTIONS

    // ======================================================

    //

    // products:

    //   selectable Courses only

    //

    // allProducts:

    //   every current Course returned by the API

    //

    // Conflict detection uses allProducts so that an existing

    // Enrollment can still be checked when its Course is no

    // longer available in the dropdown.

    this.setState({

      products: updatedProducts,

      allProducts: products,

    });

  }

  // called from componentDidMount

  async populateEnrollment() {

    try {

      const enrollmentId = this.props.match.params.id;

      if (enrollmentId === "new") return;

      // const { data: rental } = await getRental(rentalId);

      // this.setState({ data: this.mapToViewModel(rental) });

    } catch (ex) {

      switch (ex.response.status) {

        case 404:

          toast.error(ex.response.data);

          break;

        case 500:

          toast.error(ex.response.data);

          break;

        default:

          toast.error("EnrollmemtForm : Unspecified Error Occured");

      }

      this.props.history.replace("/not-found");

    }

  }

  async componentDidMount() {

    await this.populateCustomers();

    await this.populateProducts();

    await this.populateEnrollment();

  }

  // ========================================================

  // STEP 14:

  // NORMALIZE A COURSE DATE

  // ========================================================

  //

  // Course schedules are based on calendar dates.

  //

  // We compare the YYYY-MM-DD portion instead of converting the

  // date into a browser-local timestamp. This avoids accidentally

  // shifting a Course to another calendar day because of timezone

  // conversion.

  //

  // Example:

  //

  //   2026-10-01T00:00:00.000Z

  //

  // becomes:

  //

  //   2026-10-01

  //

  // YYYY-MM-DD strings can safely be compared lexicographically

  // because the components are ordered year -> month -> day.

  normalizeCourseDate = (dateValue) => {

    if (!dateValue) {

      return null;

    }

    const normalizedDate = String(dateValue).slice(0, 10);

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(normalizedDate)) {

      return null;

    }

    return normalizedDate;

  };

  // ========================================================

  // STEP 14:

  // CHECK WHETHER A COURSE HAS A COMPLETE SCHEDULE

  // ========================================================

  //

  // Conflict detection requires all four schedule fields.

  // If any field is unavailable, the application cannot safely

  // claim that the Course does or does not conflict.

  hasCompleteSchedule = (course) => {

    return Boolean(

      course &&

        course.startDate &&

        course.endDate &&

        course.startTime &&

        course.endTime

    );

  };

  // ========================================================

  // STEP 14:

  // DETERMINE WHETHER TWO COURSE SCHEDULES CONFLICT

  // ========================================================

  //

  // A conflict requires BOTH:

  //

  // 1. overlapping calendar date ranges

  // 2. overlapping daily time ranges

  //

  // Courses occur every calendar day, including weekends, so no

  // weekday filtering is required.

  coursesConflict = (newCourse, existingCourse) => {

    // Both Course schedules must be complete.

    if (

      !this.hasCompleteSchedule(newCourse) ||

      !this.hasCompleteSchedule(existingCourse)

    ) {

      return false;

    }

    // ------------------------------------------------------

    // NORMALIZE THE DATE RANGES

    // ------------------------------------------------------

    const newStartDate = this.normalizeCourseDate(newCourse.startDate);

    const newEndDate = this.normalizeCourseDate(newCourse.endDate);

    const existingStartDate = this.normalizeCourseDate(

      existingCourse.startDate

    );

    const existingEndDate = this.normalizeCourseDate(existingCourse.endDate);

    // If any date cannot be normalized, do not perform an

    // unreliable comparison.

    if (

      !newStartDate ||

      !newEndDate ||

      !existingStartDate ||

      !existingEndDate

    ) {

      return false;

    }

    // ------------------------------------------------------

    // DATE-RANGE OVERLAP

    // ------------------------------------------------------

    //

    // Date ranges are inclusive.

    //

    // Existing: 1 Oct -------- 10 Oct

    // New:             5 Oct -------- 15 Oct

    //

    // These overlap.

    //

    // Existing: 1 Oct -------- 10 Oct

    // New:                        11 Oct -------- 20 Oct

    //

    // These do not overlap.

    const datesOverlap =

      newStartDate <= existingEndDate &&

      newEndDate >= existingStartDate;

    // ------------------------------------------------------

    // DAILY TIME-RANGE OVERLAP

    // ------------------------------------------------------

    //

    // Times are stored as zero-padded HH:mm values, so string

    // comparison works correctly.

    //

    // Strict comparisons deliberately allow schedules merely to

    // touch at their boundaries:

    //

    // Existing: 08:00 -------- 12:00

    // New:                     12:00 -------- 16:00

    //

    // 12:00 < 12:00 is false, so this is NOT a conflict.

    const timesOverlap =

      newCourse.startTime < existingCourse.endTime &&

      newCourse.endTime > existingCourse.startTime;

    // A scheduling conflict exists only when BOTH the date range

    // and the daily time range overlap.

    const hasConflict = datesOverlap && timesOverlap;

    return hasConflict;

  };

  // ========================================================

  // STEP 14:

  // FORMAT A COURSE DATE FOR THE WARNING

  // ========================================================

  formatConflictDate = (dateValue) => {

    const normalizedDate = this.normalizeCourseDate(dateValue);

    if (!normalizedDate) {

      return "Unknown date";

    }

    const [year, month, day] = normalizedDate.split("-").map(Number);

    // Construct the Date from separate local calendar components

    // so timezone conversion does not unexpectedly move the date.

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-GB", {

      day: "numeric",

      month: "short",

      year: "numeric",

    });

  };

  // ========================================================

  // STEP 14:

  // FORMAT A COMPLETE COURSE SCHEDULE

  // ========================================================

  formatCourseSchedule = (course) => {

    if (!this.hasCompleteSchedule(course)) {

      return "Schedule unavailable";

    }

    return `${this.formatConflictDate(

      course.startDate

    )} – ${this.formatConflictDate(course.endDate)}, ${

      course.startTime

    }–${course.endTime}`;

  };

  // ========================================================

  // STEP 14:

  // CHECK THE SELECTED STUDENT'S EXISTING COURSE SCHEDULES

  // ========================================================

  //

  // This method:

  //

  // 1. reads the selected Student and Course

  // 2. retrieves the Student's latest Enrollment records

  // 3. resolves each Enrollment to its CURRENT Course record

  // 4. compares the Course schedules

  // 5. stores any conflicts for display

  //

  // IMPORTANT:

  //

  // Scheduling conflicts are now BLOCKING conditions.

  //

  // They are deliberately kept separate from this.state.errors

  // because Course scheduling is an asynchronous business rule,

  // whereas this.state.errors contains ordinary synchronous

  // Joi/form-validation errors.

  //

  // Enrollment availability is derived from:

  //

  //   scheduleConflicts

  //   conflictChecking

  //   conflictCheckError

  //

  // This keeps normal field validation and asynchronous scheduling

  // validation separate while still allowing both to block Enroll.

  checkScheduleConflicts = async () => {

    const { customerId, productId } = this.state.data;

    const { allProducts } = this.state;

    // ------------------------------------------------------

    // BOTH STUDENT AND COURSE MUST BE SELECTED

    // ------------------------------------------------------

    if (!customerId || !productId) {

      // Invalidate an earlier request that may still be running.

      ++this.conflictCheckRequestId;

      this.setState({

        studentEnrollments: [],

        scheduleConflicts: [],

        conflictChecking: false,

        conflictCheckError: "",

      });

      return [];

    }

    // Give this asynchronous request its own version number.

    const requestId = ++this.conflictCheckRequestId;

    // ------------------------------------------------------

    // FIND THE NEW/PROPOSED CURRENT COURSE

    // ------------------------------------------------------

    const selectedCourse = allProducts.find(

      (product) => String(product._id) === String(productId)

    );

    if (!selectedCourse) {

      this.setState({

        scheduleConflicts: [],

        conflictChecking: false,

        conflictCheckError:

          "Unable to check Course scheduling conflicts because the selected Course schedule could not be found.",

      });

      return null;

    }

    if (!this.hasCompleteSchedule(selectedCourse)) {

      this.setState({

        scheduleConflicts: [],

        conflictChecking: false,

        conflictCheckError:

          "Unable to check Course scheduling conflicts because the selected Course schedule is incomplete.",

      });

      return null;

    }

    // ------------------------------------------------------

    // BEGIN THE ASYNCHRONOUS CHECK

    // ------------------------------------------------------

    this.setState({

      conflictChecking: true,

      conflictCheckError: "",

      scheduleConflicts: [],

    });

    try {

      // Always retrieve the Student's latest Enrollment records.

      //

      // This method is also called immediately before submission,

      // so that second call obtains the latest information then.

      const { data: studentEnrollments } =

        await getEnrollmentsByCustomerId(customerId);

      // ----------------------------------------------------

      // IGNORE AN OBSOLETE RESPONSE

      // ----------------------------------------------------

      //

      // If another conflict check started while this request was

      // waiting for the server, do not let this older result

      // overwrite the latest Student/Course selection.

      if (requestId !== this.conflictCheckRequestId) {

        return [];

      }

      const scheduleConflicts = [];

      // If any existing Enrollment cannot be checked reliably,

      // remember that separately. "Could not check everything"

      // must not silently become "there are no conflicts".

      let incompleteScheduleData = false;

      // ----------------------------------------------------

      // COMPARE EVERY EXISTING ENROLLMENT

      // ----------------------------------------------------

      studentEnrollments.forEach((enrollment) => {

        // Enrollment stores an embedded Product snapshot.

        //

        // Use its _id to find the CURRENT Product/Course record.

        // The current Product is authoritative for Step 14 so that

        // later schedule edits are reflected by conflict detection.

        const existingProductId =

          enrollment.product && enrollment.product._id;

        if (!existingProductId) {

          incompleteScheduleData = true;

          return;

        }

        const existingCourse = allProducts.find(

          (product) =>

            String(product._id) === String(existingProductId)

        );

        // If the current Course cannot be found, do not silently

        // treat this Enrollment as conflict-free.

        if (!existingCourse) {

          incompleteScheduleData = true;

          return;

        }

        // Likewise, an incomplete schedule cannot be compared

        // reliably.

        if (!this.hasCompleteSchedule(existingCourse)) {

          incompleteScheduleData = true;

          return;

        }

        // Compare the selected Course with this existing Course.

        //

        // We deliberately do NOT skip matching Product IDs.

        // If the application permits a Student to attempt the same

        // Course twice, that Course naturally conflicts with itself.

        // Any separate duplicate-enrollment rule can still be

        // handled by the existing backend.

        if (this.coursesConflict(selectedCourse, existingCourse)) {

          scheduleConflicts.push({

            enrollment: enrollment,

            course: existingCourse,

          });

        }

      });

      // ----------------------------------------------------

      // STORE THE RESULT

      // ----------------------------------------------------

      this.setState({

        studentEnrollments: studentEnrollments,

        scheduleConflicts: scheduleConflicts,

        conflictChecking: false,

        // Conflicts that were successfully detected remain in

        // scheduleConflicts even if another Course could not be

        // checked.

        conflictCheckError: incompleteScheduleData

          ? "Some existing Course schedules could not be checked because their current scheduling information is unavailable."

          : "",

      });

      return scheduleConflicts;

    } catch (ex) {

      // ----------------------------------------------------

      // CONFLICT-DATA REQUEST FAILED

      // ----------------------------------------------------

      //

      // This is explicitly NOT equivalent to finding zero

      // scheduling conflicts.

      if (requestId !== this.conflictCheckRequestId) {

        return [];

      }

      console.error(

        "Unable to check Course scheduling conflicts:",

        ex

      );

      this.setState({

        studentEnrollments: [],

        scheduleConflicts: [],

        conflictChecking: false,

        conflictCheckError:

          "Unable to check Course scheduling conflicts because the student's Enrollment information could not be retrieved.",

      });

      return null;

    }

  };

  componentDidUpdate(prevProps, prevState) {

    // ======================================================

    // EXISTING BEHAVIOR:

    // UPDATE PHONE WHEN STUDENT CHANGES

    // ======================================================

    const customerChanged =

      prevState.data.customerId !== this.state.data.customerId;

    if (customerChanged) {

      // Find the customer with the matching customerId.

      const selectedCustomer = this.state.customers.find(

        (customer) => customer._id === this.state.data.customerId

      );

      // Guard the lookup so clearing/changing the selection does

      // not try to read .phone from undefined.

      if (selectedCustomer) {

        this.setState({

          data: {

            ...this.state.data,

            phone: selectedCustomer.phone,

          },

        });

      }

    }

    // ======================================================

    // EXISTING BEHAVIOR:

    // UPDATE COURSE DETAILS WHEN COURSE CHANGES

    // ======================================================

    const productChanged =

      prevState.data.productId !== this.state.data.productId;

    // DA 6 03 2023 Bug fix : Put check in place if movies is viewed before the return selected added && !this.state.data.dateOut.

    if (productChanged) {

      // Find the product with the matching productId.

      const selectedProduct = this.state.products.find(

        (product) => product._id === this.state.data.productId

      );

      // Guard the lookup so an empty/temporary selection does not

      // try to read Course fields from undefined.

      if (selectedProduct) {

        const startDate = new Date(selectedProduct.startDate);

        const endDate = new Date(selectedProduct.endDate);

        // Preserve the existing Course Fee and date behavior.

        this.setState({

          data: {

            ...this.state.data,

            productPrice: selectedProduct.productPrice.$numberDecimal,

            startDate: startDate.toLocaleDateString("en-ZA"),

            endDate: endDate.toLocaleDateString("en-ZA"),

            // STEP 14 UI improvement:

            // Course times are already stored as HH:mm strings,

            // so they can be copied directly without conversion.

            startTime: selectedProduct.startTime,

            endTime: selectedProduct.endTime,

          },

        });

      }

    }

    // ======================================================

    // STEP 14:

    // RECHECK WHEN STUDENT OR COURSE CHANGES

    // ======================================================

    //

    // The conflict checker itself verifies that BOTH selections

    // are present before making a server request.

    //

    // Its setState() calls do not change customerId/productId, so

    // they do not create an infinite componentDidUpdate loop.

    if (customerChanged || productChanged) {

      this.checkScheduleConflicts();

    }

  }

  // You can remap data models from server to the display component

  // mapToViewModel(rental) {

  //   return {

  //     _id: rental._id,

  //     customerId: rental.customer._id,

  //     name: rental.customer.name,

  //     phone: rental.customer.phone,

  //     movieId: rental.movie._id,

  //     title: rental.movie.title,

  //     dailyRentalRate: rental.movie.dailyRentalRate,

  //   };

  // }

  doEnrollment = async () => {

    // ======================================================

    // STEP 14:

    // RECHECK IMMEDIATELY BEFORE SUBMISSION

    // ======================================================

    //

    // Another Enrollment could have been created after the first

    // dropdown-triggered check. Retrieve the latest Enrollment

    // information again immediately before saveEnrollment().

    const latestConflicts = await this.checkScheduleConflicts();

    // ======================================================

    // ASSORTED CALENDAR FEATURES - STEP 3:

    // FAIL-CLOSED FINAL SUBMISSION GUARD

    // ======================================================

    //

    // checkScheduleConflicts() has three meaningful outcomes:

    //

    //   []       -> the check completed successfully and found

    //               no scheduling conflicts

    //

    //   [ ... ]  -> the check completed successfully and found

    //               one or more scheduling conflicts

    //

    //   null     -> the application could not reliably establish

    //               whether the selection is conflict-free

    //

    // Only an empty array is safe enough to continue to the

    // existing saveEnrollment() call.

    //

    // This guard protects the actual submission path, so a conflict

    // cannot be bypassed merely by triggering submission some way

    // other than clicking the disabled Enroll button.



    // ------------------------------------------------------

    // CONFLICT CHECK COULD NOT BE COMPLETED

    // ------------------------------------------------------

    //

    // "Unknown" is not treated as "safe". Under the fail-closed

    // policy, an unavailable/incomplete conflict check stops here.

    if (latestConflicts === null) {

      console.warn(

        "Enrollment blocked because Course scheduling conflicts could not be checked."

      );

      return;

    }



    // ------------------------------------------------------

    // ONE OR MORE SCHEDULING CONFLICTS EXIST

    // ------------------------------------------------------

    //

    // A known conflict must never reach saveEnrollment().

    if (latestConflicts.length > 0) {

      console.warn(

        "Enrollment blocked because of Course scheduling conflict:",

        latestConflicts

      );

      return;

    }



    // Reaching this point means latestConflicts is an empty array.

    // The latest check completed successfully and found no conflict,

    // so the existing saveEnrollment() call may proceed.

    // ======================================================

    // EXISTING ENROLLMENT SAVE

    // ======================================================

    try {

      const enrollmentData = await saveEnrollment(

        this.state.data.customerId,

        this.state.data.productId

      );

      this.setState({

        enrollmentDate: enrollmentData.data.enrollmentDate,

        enrollmentId: enrollmentData.data._id,

      });

      //this.props.history.push("/enrollments");

    } catch (ex) {

      if (ex.response)

        switch (ex.response.status) {

          case 400:

            toast.error(ex.response.data);

            break;

          case 401:

            toast.error(ex.response.data);

            break;

          case 404:

            toast.error(ex.response.data);

            break;

          case 403:

            toast.error(ex.response.data);

            break;


          // ====================================================

          // BACKEND SCHEDULING CONFLICT PROTECTION

          // ====================================================

          //

          // The frontend checks scheduling conflicts before

          // submission, but the backend now independently enforces

          // the same business rule.

          //

          // HTTP 409 means the Enrollment conflicts with the

          // student's current Course schedule, or the backend

          // could not safely verify the existing schedules.

          //

          // Display the backend message so the user can see why

          // the Enrollment was rejected.

          case 409:

            toast.error(ex.response.data);

            break;

          default:

            toast.error("A Unspecified Error occured.", ex.response.data);

        }

    }

  };

  async doSubmit() {

    if (!this.state.enrollmentDate) {

      await this.doEnrollment();

      return;

    }

  }

  render() {

    // ======================================================

    // STEP 14:

    // CONFLICT-CHECK DISPLAY STATE

    // ======================================================

    const {

      scheduleConflicts,

      conflictChecking,

      conflictCheckError,

    } = this.state;

    // ======================================================

    // ASSORTED CALENDAR FEATURES - STEP 3:

    // FAIL-CLOSED ENROLLMENT AVAILABILITY

    // ======================================================

    //

    // Keep ordinary Joi/form validation separate from the

    // asynchronous Course scheduling-conflict system.

    //

    // Scheduling blocks Enrollment when:

    //

    // 1. a known Course conflict exists;

    // 2. a conflict check is still running; or

    // 3. the conflict check failed/could not establish safety.

    //

    // This is deliberately fail closed:

    //

    //   confirmed safe      -> may proceed

    //   confirmed conflict  -> blocked

    //   still checking      -> blocked

    //   unable to check     -> blocked

    //

    // We reuse the existing Step 14 state instead of creating a

    // second conflict system.

    const hasScheduleConflict = scheduleConflicts.length > 0;



    const conflictStatusBlocksEnrollment =

      hasScheduleConflict ||

      conflictChecking ||

      Boolean(conflictCheckError);



    // Normal Joi validation must also pass.

    const enrollmentButtonDisabled =

      Boolean(this.validate()) || conflictStatusBlocksEnrollment;

    return (

      //DA 5 March 2023 added conditional form for new

      <div>

        <h1>New Enrollment</h1>

        <form onSubmit={this.handleSubmit}>

          <div className="row">

            <div className="col-md-6">

              {this.renderSelect(

                "customerId",

                "Student",

                this.state.customers

              )}

              {this.renderInputReadOnly("phone", "Phone")}

              {this.renderSelect(

                "productId",

                "Course",

                this.state.products

              )}

            </div>

            <div className="col-md-4">

              <div className="row">

                <div className="col-md-6">

                  {this.renderInputReadOnly(

                    "startDate",

                    "Start Date"

                  )}

                </div>

                <div className="col-md-6">

                  {this.renderInputReadOnly(

                    "endDate",

                    "End Date"

                  )}

                </div>

              </div>

              {/* ================================================

                  STEP 14 UI IMPROVEMENT:

                  SHOW THE SELECTED COURSE'S DAILY TIME RANGE

              \\================================================ */}

              <div className="row">

                <div className="col-md-6">

                  {this.renderInputReadOnly(

                    "startTime",

                    "Start Time"

                  )}

                </div>

                <div className="col-md-6">

                  {this.renderInputReadOnly(

                    "endTime",

                    "End Time"

                  )}

                </div>

              </div>

              {this.renderInputReadOnly(

                "productPrice",

                "Course Fee"

              )}

              {/* ==================================================

                  STEP 14:

                  COURSE SCHEDULING CONFLICT INFORMATION

              \\================================================== */}

              {/* -----------------------------------------------

                  CONFLICT CHECK CURRENTLY RUNNING

              \\----------------------------------------------- */}

              {conflictChecking && (

                <div

                  className="alert alert-info mt-3"

                  role="status"

                >

                  Checking the student's existing Course schedules...

                </div>

              )}

              {/* -----------------------------------------------

                  CONFLICT-DATA ERROR

              \\----------------------------------------------- */}

              {conflictCheckError && (

                <div

                  className="alert alert-danger mt-3"

                  role="alert"

                >

                  <strong>

                    Scheduling conflict check unavailable

                  </strong>

                  <br />

                  {conflictCheckError}

                  <br />

                  <small>

                    This does not confirm that the selected Course

                    is conflict-free.

                  </small>

                </div>

              )}

              {/* -----------------------------------------------

                  BLOCKING SCHEDULING CONFLICT

              \\----------------------------------------------- */}

              {scheduleConflicts.length > 0 && (

                <div

                  className="alert alert-warning mt-3"

                  role="alert"

                >

                  <h5 className="alert-heading">

                    Course scheduling conflict

                  </h5>

                  <p>

                    The selected student is already enrolled in

                    the following overlapping Course

                    {scheduleConflicts.length > 1 ? "s" : ""}

                    :

                  </p>

                  {scheduleConflicts.map(

                    ({ enrollment, course }) => (

                      <div

                        key={enrollment._id || course._id}

                        className="mb-2"

                      >

                        <strong>

                          {course.name}

                        </strong>

                        <br />

                        Scheduled:{" "}

                        {this.formatCourseSchedule(course)}

                      </div>

                    )

                  )}

                  <hr />

                  <p className="mb-0">

                    The selected Course overlaps with

                    {scheduleConflicts.length > 1

                      ? " these schedules."

                      : " this schedule."}

                    {" "}

                    <strong>

                      Enrollment unavailable: choose a different Student

                      or Course before enrolling.

                    </strong>

                  </p>

                </div>

              )}

              {/* ==================================================

                  EXISTING FORM ACTIONS

              \\================================================== */}

              <div className="text-right border-top">

                {!this.state.enrollmentDate ? (

                  // ==================================================

                  // ASSORTED CALENDAR FEATURES - STEP 3:

                  // FAIL-CLOSED ENROLL BUTTON

                  // ==================================================

                  //

                  // Form.renderButton() only considers this.validate().

                  // It does not know about asynchronous Course

                  // scheduling conflicts, so EnrollmentForm renders

                  // its own submit button here.

                  //

                  // Keeping this rule local avoids changing the behavior

                  // of every other form that inherits from Form.

                  <button

                    type="submit"

                    className="btn btn-primary mt-2 mr-2"

                    disabled={enrollmentButtonDisabled}

                  >

                    Enroll

                  </button>

                ) : null}

                {this.state.enrollmentDate ? (

                  <Link

                    className="btn btn-primary mt-2 mr-2"

                    to={{

                      pathname: `/enrollments/${this.state.enrollmentId}`,

                      state: { ...this.state.data },

                    }}

                  >

                    Edit Now

                  </Link>

                ) : null}

                {this.renderLink("/enrollments", "Exit")}

              </div>

            </div>

          </div>

        </form>

      </div>

    );

  }

}

export default EnrollmentForm;
