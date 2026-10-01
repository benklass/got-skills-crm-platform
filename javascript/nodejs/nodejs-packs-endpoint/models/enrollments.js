// ============================================================
// ENROLLMENT MODEL
// ============================================================
//
// An Enrollment represents a student's enrollment in a Course.
//
// The Enrollment contains:
//
// 1. An embedded snapshot of the Customer.
// 2. An embedded snapshot of the Product / Course.
// 3. The date on which the Enrollment was created.
// 4. An optional completion date.
// 5. The Enrollment fee.
// 6. Whether the Enrollment has been paid.
//
// IMPORTANT:
//
// The Product information is EMBEDDED inside the Enrollment.
//
// This means that when an Enrollment is created, selected
// information from the Product document is copied into the
// Enrollment document.
//
// For example:
//
// PRODUCT:
//
// {
//   name: "JavaScript Fundamentals",
//   startDate: ...,
//   endDate: ...,
//   startTime: "08:00",
//   endTime: "17:00"
// }
//
// becomes:
//
// ENROLLMENT:
//
// {
//   product: {
//     name: "JavaScript Fundamentals",
//     startDate: ...,
//     endDate: ...,
//     startTime: "08:00",
//     endTime: "17:00"
//   }
// }
//
// The Calendar Event Time Extension adds startTime and endTime
// to this embedded Product snapshot.
// ============================================================


// Joi is used for validating incoming Enrollment requests.
const Joi = require("joi");


// Mongoose is used to define the Enrollment schema and
// communicate with MongoDB.
const mongoose = require("mongoose");


// Moment is currently used when completing an Enrollment
// to calculate the number of days since enrollment.
const moment = require("moment");


// ============================================================
// ENROLLMENT SCHEMA
// ============================================================

const enrollmentSchema = new mongoose.Schema({
  // ==========================================================
  // EMBEDDED CUSTOMER
  // ==========================================================
  //
  // The Enrollment stores a snapshot of the Customer
  // associated with the Enrollment.

  customer: {
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
      },

      phone: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
      },
    }),

    required: true,
  },


  // ==========================================================
  // EMBEDDED PRODUCT / COURSE
  // ==========================================================
  //
  // The Enrollment also stores a snapshot of the Product
  // associated with the Enrollment.
  //
  // Previously this snapshot stored:
  //
  // - Course name
  // - number in stock
  // - start date
  // - end date
  // - price
  //
  // The Calendar Event Time Extension now additionally stores:
  //
  // - startTime
  // - endTime
  //
  // This allows the Enrollment to preserve the daily Course
  // schedule that existed when the Enrollment was created.

  product: {
    type: new mongoose.Schema({
      // ------------------------------------------------------
      // COURSE NAME
      // ------------------------------------------------------

      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 255,
      },


      // ------------------------------------------------------
      // COURSE CAPACITY
      // ------------------------------------------------------

      numberInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 9999,
      },


      // ------------------------------------------------------
      // COURSE DATE RANGE
      // ------------------------------------------------------
      //
      // startDate determines the first calendar date on which
      // the Course takes place.
      //
      // endDate determines the final calendar date on which
      // the Course takes place.

      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        required: true,
      },


      // ======================================================
      // NEW: DAILY COURSE TIME RANGE
      // ======================================================
      //
      // These fields were added as part of the Calendar Event
      // Time Extension.
      //
      // They are copies of the corresponding values stored in
      // the Product document.
      //
      // Example Product:
      //
      // startDate = 2026-10-01
      // endDate   = 2026-10-31
      // startTime = "08:00"
      // endTime   = "17:00"
      //
      // This means that the Course runs every calendar day
      // from 08:00 until 17:00 during that date range.
      //
      // When a student enrolls, Step 4 will copy these values
      // from the Product into this embedded Product snapshot.


      // Daily time at which the Course starts.
      //
      // Stored as a String using 24-hour HH:mm format.
      //
      // Example:
      //
      // "08:00"
      startTime: {
        type: String,
        required: true,
      },


      // Daily time at which the Course ends.
      //
      // Stored as a String using 24-hour HH:mm format.
      //
      // Example:
      //
      // "17:00"
      endTime: {
        type: String,
        required: true,
      },


      // ------------------------------------------------------
      // COURSE PRICE
      // ------------------------------------------------------

      productPrice: {
        type: mongoose.Decimal128,
        required: true,
        min: 0,
        max: 9999999,
      },
    }),

    required: true,
  },


  // ==========================================================
  // ENROLLMENT DATE
  // ==========================================================
  //
  // This is the timestamp recording WHEN the student enrolled.
  //
  // This is completely different from product.startTime.
  //
  // Example:
  //
  // Course:
  // product.startTime = "08:00"
  //
  // Student enrolls:
  // enrollmentDate = 2026-09-26T11:35:42.000Z
  //
  // Later, the Calendar Event Time Extension will use this
  // actual enrollmentDate timestamp to display the Enrollment
  // event for 15 minutes on the calendar.

  enrollmentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },


  // ==========================================================
  // COMPLETION DATE
  // ==========================================================
  //
  // This remains empty until the Enrollment is completed.

  completionDate: {
    type: Date,
  },


  // ==========================================================
  // ENROLLMENT FEE
  // ==========================================================

  enrollmentFee: {
    type: mongoose.Decimal128,
    min: 0,
  },


  // ==========================================================
  // PAYMENT STATUS
  // ==========================================================
  //
  // Indicates whether this Enrollment has been paid.

  enrollmentPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
});


// ============================================================
// ENROLLMENT LOOKUP
// ============================================================
//
// DA 6 03 2023:
// Added enrollmentId for the lookup to fix a bug where two
// Enrollments with the same Customer and Product could not
// be processed.
//
// DA 7 03 2023:
// Bug fix for enrollmentId field changed from "._id" to _id.
// ============================================================

enrollmentSchema.statics.lookup = function (
  enrollmentId,
  customerId
  // productId
) {
  return this.findOne({
    _id: enrollmentId,

    "customer._id": customerId,

    // "product._id": productId,
  });
};


// ============================================================
// CUSTOMER ENROLLMENT LOOKUP
// ============================================================
//
// DA 28 02 2023:
//
// Check whether a Customer has an Enrollment.
//
// This is used to prevent deleting a Customer who still has
// an associated Enrollment.
// ============================================================

enrollmentSchema.statics.enrollmentLookup = function (
  customerId
) {
  return this.findOne({
    "customer._id": customerId,
  });
};


// ============================================================
// PRODUCT ENROLLMENT LOOKUP
// ============================================================
//
// DA 02 03 2023:
//
// Check whether a Product has an Enrollment.
//
// This is used by the Product DELETE route to prevent a
// Product from being deleted while it has an associated
// Enrollment.
// ============================================================

enrollmentSchema.statics.enrollmentLookupProduct = function (
  productId
) {
  return this.findOne({
    "product._id": productId,
  });
};


// ============================================================
// COMPLETE AN ENROLLMENT
// ============================================================
//
// Called when an Enrollment is completed.
//
// The completion date is set to the current date/time.
//
// The existing implementation also calculates how many days
// have passed since enrollment.
//
// If an enrollmentFee does not already exist, the Product's
// price is used.
// ============================================================

enrollmentSchema.methods.completion = function () {
  // Record the date/time at which the Enrollment was
  // completed.
  this.completionDate = new Date();


  // Calculate the number of days since the Enrollment was
  // originally created.
  //
  // This variable is currently retained from the existing
  // implementation.
  const enrollmentDays = moment().diff(
    this.enrollmentDate,
    "days"
  );


  // Existing calculation retained as a comment:
  //
  // this.enrollmentFee =
  //   enrollmentDays * this.product.productPrice;


  // If the Enrollment does not already have a fee, use the
  // Product price stored in the embedded Product snapshot.
  if (!this.enrollmentFee) {
    this.enrollmentFee = this.product.productPrice;
  }
};


// ============================================================
// CREATE THE MONGOOSE MODEL
// ============================================================

const Enrollment = mongoose.model(
  "Enrollment",
  enrollmentSchema
);


// ============================================================
// VALIDATE AN ENROLLMENT REQUEST
// ============================================================
//
// IMPORTANT:
//
// startTime and endTime are deliberately NOT added here.
//
// The frontend does not decide what Course times should be
// stored in an Enrollment.
//
// An Enrollment request only identifies:
//
// customerId
// productId
//
// The backend then retrieves the actual Product and copies
// its Course information into the Enrollment.
//
// Therefore, in Step 4:
//
// product.startTime
//
// and:
//
// product.endTime
//
// will be copied from the Product retrieved from MongoDB.
//
// This prevents the frontend from supplying Course scheduling
// information that differs from the actual Product record.
// ============================================================

function validateEnrollment(enrollment) {
  const schema = {
    customerId: Joi.objectId().required(),

    productId: Joi.objectId().required(),
  };

  return Joi.validate(enrollment, schema);
}


// ============================================================
// EXPORTS
// ============================================================

exports.Enrollment = Enrollment;

exports.validateEnrollment = validateEnrollment;