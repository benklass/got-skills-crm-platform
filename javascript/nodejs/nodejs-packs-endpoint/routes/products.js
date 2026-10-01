// ============================================================
// PRODUCTS / COURSES ROUTES
// ============================================================
//
// This router handles the API endpoints for Products.
//
// In the Got Skills application, Products represent Courses.
//
// Main operations:
//
// GET    /api/products       -> Get all Courses
// GET    /api/products/:id   -> Get one Course
// POST   /api/products       -> Create a Course
// PUT    /api/products/:id   -> Update a Course
// DELETE /api/products/:id   -> Delete a Course
//
// CALENDAR EVENT TIME EXTENSION:
//
// Courses previously contained only:
//
// startDate
// endDate
//
// The Course model now also contains:
//
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
// This represents a Course running every calendar day from
// 08:00 until 17:00 between 1 October and 31 October 2026.
//
// The POST and PUT routes therefore need to save these two
// additional fields.
//
// The GET routes do not require special changes because
// Mongoose returns the complete Product document.
// ============================================================


// Authentication middleware.
//
// Used by POST and PUT so that only authenticated users
// can create or edit Courses.
const auth = require("../middleware/auth");


// Admin middleware.
//
// Used together with auth for deleting Courses.
const admin = require("../middleware/admin");


const express = require("express");


// Import the Product model and its validation function.
//
// validateProduct() now also validates:
//
// - startTime is required
// - endTime is required
// - both use HH:mm format
// - endTime must be later than startTime
//
// Those validation changes were implemented in Step 1.
const {
  Product,
  validateProduct,
} = require("../models/products");


// Instructor model.
//
// Products/Courses contain an embedded copy of the selected
// Instructor's information.
const { Instructor } = require("../models/instructors");


// Enrollment model.
//
// This is currently used by the DELETE route to prevent
// deleting a Product that is associated with an Enrollment.
const { Enrollment } = require("../models/enrollments");


// Create the Express router.
const router = express.Router();


// ============================================================
// GET ALL PRODUCTS / COURSES
// ============================================================
//
// Endpoint:
//
// GET /api/products
//
// Retrieves all Products from MongoDB and sorts them by name.
//
// No special Calendar Event Time Extension change is required
// here.
//
// Product.find() returns the complete Product documents.
// Therefore, once startTime and endTime exist in MongoDB,
// they will automatically be included in this response.
//
// Example returned Course:
//
// {
//   "_id": "...",
//   "name": "Programming Course",
//   "startDate": "2026-10-01T00:00:00.000Z",
//   "endDate": "2026-10-31T00:00:00.000Z",
//   "startTime": "08:00",
//   "endTime": "17:00"
// }
// ============================================================

router.get("/", async (req, res) => {
  const products = await Product.find().sort("name");

  res.send(products);
});


// ============================================================
// GET ONE PRODUCT / COURSE
// ============================================================
//
// Endpoint:
//
// GET /api/products/:id
//
// Example:
//
// GET /api/products/66d9ad79a79c5e84f1367abc
//
// Like the GET-all route above, no special code is required
// for startTime and endTime.
//
// Product.findById() returns the complete Product document,
// including the new scheduling fields.
// ============================================================

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);

  // Return 404 if a Product with this ID does not exist.
  if (!product)
    return res
      .status(404)
      .send("The request with the given ID was not found!");

  // Return the complete Product/Course.
  res.send(product);
});


// ============================================================
// CREATE PRODUCT / COURSE
// ============================================================
//
// Endpoint:
//
// POST /api/products
//
// Authentication is required.
//
// CALENDAR EVENT TIME EXTENSION:
//
// The request body must now contain:
//
// startTime
// endTime
//
// Example:
//
// {
//   ...
//   "startDate": "2026-10-01",
//   "endDate": "2026-10-31",
//   "startTime": "08:00",
//   "endTime": "17:00",
//   ...
// }
//
// validateProduct() checks the request before the Product is
// created.
//
// The new time values are then copied from req.body into the
// Product document and saved to MongoDB.
// ============================================================

router.post("/", auth, async (req, res) => {
  // ----------------------------------------------------------
  // 1. VALIDATE THE REQUEST
  // ----------------------------------------------------------
  //
  // validateProduct() validates all Product fields.
  //
  // For the new Course scheduling fields it checks:
  //
  // - startTime exists
  // - endTime exists
  // - startTime uses HH:mm format
  // - endTime uses HH:mm format
  // - endTime is later than startTime
  //
  // If validation fails, return HTTP 400 Bad Request.

  const { error } = validateProduct(req.body);

  if (error)
    return res
      .status(400)
      .send(error.details[0].message);


  // ----------------------------------------------------------
  // 2. FIND THE SELECTED INSTRUCTOR
  // ----------------------------------------------------------
  //
  // The frontend sends instructorId.
  //
  // We retrieve the corresponding Instructor because the
  // Product stores an embedded copy of Instructor information.

  const instructor = await Instructor.findById(
    req.body.instructorId
  );

  // The request cannot create a Course with an Instructor
  // that does not exist.
  if (!instructor)
    return res
      .status(400)
      .send("Invalid instructor request.");


  // ----------------------------------------------------------
  // 3. CREATE THE PRODUCT / COURSE
  // ----------------------------------------------------------

  const product = new Product({
    productCode: req.body.productCode,

    name: req.body.name,

    description: req.body.description,


    // --------------------------------------------------------
    // EMBEDDED INSTRUCTOR INFORMATION
    // --------------------------------------------------------

    instructor: {
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      address: instructor.address,
      phone: instructor.phone,
    },


    // Number of available places in the Course.
    numberInStock: req.body.numberInStock,


    // --------------------------------------------------------
    // COURSE DATE RANGE
    // --------------------------------------------------------
    //
    // startDate:
    // The first calendar date on which the Course runs.
    //
    // endDate:
    // The final calendar date on which the Course runs.

    startDate: req.body.startDate,

    endDate: req.body.endDate,


    // --------------------------------------------------------
    // NEW: DAILY COURSE TIME RANGE
    // --------------------------------------------------------
    //
    // These fields were added as part of the Calendar Event
    // Time Extension.
    //
    // They are deliberately separate from startDate/endDate.
    //
    // startTime:
    // The time at which the Course begins on each Course day.
    //
    // endTime:
    // The time at which the Course finishes on each Course day.
    //
    // Both values are stored as strings using 24-hour HH:mm
    // format.
    //
    // Example:
    //
    // startTime = "08:00"
    // endTime   = "17:00"

    startTime: req.body.startTime,

    endTime: req.body.endTime,


    // Course fee.
    productPrice: req.body.productPrice,


    // Whether the Course is currently active.
    active: req.body.active,
  });


  // ----------------------------------------------------------
  // 4. SAVE THE PRODUCT TO MONGODB
  // ----------------------------------------------------------

  try {
    await product.save();

    // Return the newly-created Product.
    //
    // The returned object will now also contain:
    //
    // startTime
    // endTime
    res.send(product);
  } catch (error) {
    console.log(
      "Error saving the product : ",
      error.message
    );
  }
});


// ============================================================
// UPDATE PRODUCT / COURSE
// ============================================================
//
// Endpoint:
//
// PUT /api/products/:id
//
// Authentication is required.
//
// This route updates an existing Course.
//
// CALENDAR EVENT TIME EXTENSION:
//
// startTime and endTime are now included in the update object
// so that Course scheduling times can be changed.
// ============================================================

router.put("/:id", auth, async (req, res) => {
  // ----------------------------------------------------------
  // 1. VALIDATE THE UPDATED COURSE
  // ----------------------------------------------------------
  //
  // If the request is invalid, return:
  //
  // HTTP 400 Bad Request.

  const { error } = validateProduct(req.body);

  if (error)
    return res
      .status(400)
      .send(error.details[0].message);


  // ----------------------------------------------------------
  // 2. FIND THE SELECTED INSTRUCTOR
  // ----------------------------------------------------------

  const instructor = await Instructor.findById(
    req.body.instructorId
  );

  if (!instructor)
    return res
      .status(400)
      .send("Invalid instructor.");


  // ----------------------------------------------------------
  // 3. UPDATE THE PRODUCT
  // ----------------------------------------------------------

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,

      {
        productCode: req.body.productCode,

        name: req.body.name,

        description: req.body.description,


        // ----------------------------------------------------
        // UPDATE EMBEDDED INSTRUCTOR
        // ----------------------------------------------------

        instructor: {
          _id: instructor._id,
          name: instructor.name,
          email: instructor.email,
          address: instructor.address,
          phone: instructor.phone,
        },


        numberInStock: req.body.numberInStock,


        // ----------------------------------------------------
        // COURSE DATE RANGE
        // ----------------------------------------------------

        startDate: req.body.startDate,

        endDate: req.body.endDate,


        // ----------------------------------------------------
        // NEW: DAILY COURSE TIME RANGE
        // ----------------------------------------------------
        //
        // These fields must be included here as well as in
        // POST.
        //
        // Otherwise a new Course could save its schedule,
        // but editing the Course would not update that
        // schedule.

        startTime: req.body.startTime,

        endTime: req.body.endTime,


        productPrice: req.body.productPrice,

        active: req.body.active,
      },

      {
        // Return the UPDATED document rather than the version
        // that existed before findByIdAndUpdate().
        new: true,
      }
    );


    // --------------------------------------------------------
    // 4. CHECK THAT THE PRODUCT EXISTS
    // --------------------------------------------------------

    if (!product)
      return res
        .status(404)
        .send(
          "The product with the given ID was not found!"
        );


    // --------------------------------------------------------
    // 5. RETURN THE UPDATED PRODUCT
    // --------------------------------------------------------
    //
    // The response now also contains the updated:
    //
    // startTime
    // endTime

    res.send(product);
  } catch (error) {
    console.log(
      "Error updating the product : ",
      error.message
    );
  }
});


// ============================================================
// DELETE PRODUCT / COURSE
// ============================================================
//
// Endpoint:
//
// DELETE /api/products/:id
//
// Both authentication and administrator authorization are
// required.
//
// No Calendar Event Time Extension changes are required here.
// ============================================================

router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up any Enrollment associated with this Product.
  //
  // DA 02 03 2023:
  // Check if Product has an enrollment.
  //
  // If it does, do not allow the Product to be deleted.
  //
  // enrollmentLookupProduct() is defined in:
  //
  // models/enrollments.js

  const enrollment =
    await Enrollment.enrollmentLookupProduct(
      req.params.id
    );


  // Prevent deletion if the Course has an Enrollment.
  if (enrollment)
    return res
      .status(400)
      .send(
        "Product has a enrollment unable to process, close out enrollment then you able to delete."
      );


  // Delete the Product.
  const product = await Product.findByIdAndRemove(
    req.params.id
  );


  // Return 404 if the Product does not exist.
  if (!product)
    return res
      .status(404)
      .send(
        "The product with the given ID was not found!"
      );


  // Return the deleted Product.
  res.send(product);
});


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;