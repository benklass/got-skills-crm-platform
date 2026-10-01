const mongoose = require("mongoose");

const { instructorSchema } = require("./instructors");
const Joi = require("joi");

// ============================================================
// PRODUCT / COURSE MODEL
// ============================================================
//
// A Product represents a Course in the Got Skills CRM.
//
// Course scheduling is represented using four separate fields:
//
// startDate -> first calendar date of the Course
// endDate   -> last calendar date of the Course
// startTime -> daily Course starting time
// endTime   -> daily Course ending time
//
// Example:
//
// startDate: 2026-10-01
// endDate:   2026-10-31
// startTime: "08:00"
// endTime:   "17:00"
//
// The Calendar Event Time Extension will later use these values
// to generate one 08:00-17:00 calendar occurrence for every
// date from 1 October through 31 October, including weekends.
// ============================================================


// ============================================================
// MONGOOSE PRODUCT SCHEMA
// ============================================================

const Product = mongoose.model(
  "Products",
  new mongoose.Schema({
    productCode: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 25,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 255,
    },

    description: {
      type: String,
      required: true,
      minlenght: 15,
      maxlength: 3000,
    },

    instructor: {
      type: instructorSchema,
      ref: "Instructor",
      required: true,
    },

    numberInStock: {
      type: Number,
      required: true,
      min: 0,
      max: 9999,
    },

    // First calendar date on which the Course takes place.
    startDate: {
      type: Date,
      required: true,
    },

    // Final calendar date on which the Course takes place.
    endDate: {
      type: Date,
      required: true,
    },

    // ========================================================
    // CALENDAR EVENT TIME EXTENSION
    // ========================================================

    // Daily Course starting time.
    //
    // The value is stored as a String because it represents
    // a time of day rather than a complete date/time.
    //
    // Expected format:
    // HH:mm
    //
    // Example:
    // "08:00"
    startTime: {
      type: String,
      required: true,
    },

    // Daily Course ending time.
    //
    // Expected format:
    // HH:mm
    //
    // Example:
    // "17:00"
    endTime: {
      type: String,
      required: true,
    },

    productPrice: {
      type: mongoose.Decimal128,
      required: true,
      min: 0,
      max: 9999999,
    },

    active: {
      type: Boolean,
      default: true,
    },
  })
);


// ============================================================
// TIME VALIDATION
// ============================================================
//
// Validates a 24-hour time using the HH:mm format.
//
// Valid:
//
// 00:00
// 08:00
// 09:30
// 17:00
// 23:59
//
// Invalid:
//
// 8:00
// 24:00
// 17:70
// 25:00
//
// The leading zero is intentionally required so that valid
// values can also be compared reliably as strings.
// ============================================================

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;


// ============================================================
// PRODUCT VALIDATION
// ============================================================

function validateProduct(product) {
  const schema = {
    productCode: Joi.string()
      .min(5)
      .max(25)
      .required(),

    name: Joi.string()
      .min(5)
      .max(50)
      .required(),

    description: Joi.string()
      .min(15)
      .max(3000)
      .required(),

    instructorId: Joi.objectId().required(),

    numberInStock: Joi.number()
      .min(0)
      .required(),

    startDate: Joi.date().required(),

    endDate: Joi.date().required(),

    // NEW:
    // Daily Course start time.
    startTime: Joi.string()
      .regex(timePattern)
      .required(),

    // NEW:
    // Daily Course end time.
    endTime: Joi.string()
      .regex(timePattern)
      .required(),

    productPrice: Joi.number()
      .min(0)
      .required(),

    active: Joi.boolean(),
  };

  // ----------------------------------------------------------
  // First run the normal Joi validation.
  // ----------------------------------------------------------

  const result = Joi.validate(product, schema);

  // If Joi found an error, return it immediately.
  //
  // For example:
  //
  // startTime = "25:00"
  //
  // will fail the regular-expression validation.
  if (result.error) {
    return result;
  }

  // ----------------------------------------------------------
  // Cross-field Course time validation.
  // ----------------------------------------------------------
  //
  // Joi has now established that both values follow HH:mm.
  //
  // Because they are zero-padded 24-hour values, comparing
  // them as strings gives us their chronological order.
  //
  // Valid:
  //
  // startTime = "08:00"
  // endTime   = "17:00"
  //
  // Invalid:
  //
  // startTime = "17:00"
  // endTime   = "08:00"
  //
  // Invalid:
  //
  // startTime = "08:00"
  // endTime   = "08:00"
  //
  // Overnight Courses are NOT supported by the current
  // requirements.

  if (product.endTime <= product.startTime) {
    return {
      error: {
        details: [
          {
            message:
              '"endTime" must be later than "startTime"',
          },
        ],
      },
    };
  }

  // All Product validation has succeeded.
  return result;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports.Product = Product;
module.exports.validateProduct = validateProduct;