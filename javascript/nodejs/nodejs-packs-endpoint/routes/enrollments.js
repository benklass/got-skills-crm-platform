// ============================================================
// Enrollment Routes
// ============================================================
//
// This router handles enrollment-related API requests, including:
//
// GET    /api/enrollments
//        Return active/not-completed enrollments.
//
// GET    /api/enrollments/all
//        Return all enrollments.
//
// GET    /api/enrollments/_enrolledNotCompletedNotPaid
//        Return active unpaid enrollments.
//
// GET    /api/enrollments/_completedPaid
//        Return completed and paid enrollments.
//
// GET    /api/enrollments/_completedNotPaid
//        Return completed but unpaid enrollments.
//
// GET    /api/enrollments/_enrollmentsPaid
//        Return all paid enrollments.
//
// POST   /api/enrollments
//        Create a new enrollment.
//
// GET    /api/enrollments/customer/:customerId
//        Return all enrollments belonging to one customer.
//
// GET    /api/enrollments/:id
//        Return one enrollment by its enrollment ID.
//
// ============================================================
const express = require("express");
const mongoose = require("mongoose");
// Enrollment model and Joi validation function.
const {
  Enrollment,
  validateEnrollment,
} = require("../models/enrollments");
// Product model used when creating a new enrollment.
const { Product } = require("../models/products");
// Customer model used to validate and embed the student/customer
// information when creating a new enrollment.
const { Customer } = require("../models/customers");
// Authentication middleware.
// Currently used to protect enrollment creation.
const auth = require("../middleware/auth");
// Express router for all /api/enrollments routes.
const router = express.Router();
// ============================================================
// GET ALL ENROLLMENTS
// ============================================================
// DA 1 April 2023
// Returns all enrollments regardless of whether they are:
//
// - completed or active
// - paid or unpaid
//
// Results are ordered with the newest enrollment first.
router.get("/all", async (req, res) => {
  const enrollments = await Enrollment.find().sort(
    "-enrollmentDate"
  );
  res.send(enrollments);
});
// ============================================================
// GET ACTIVE / NOT-COMPLETED ENROLLMENTS
// ============================================================
// DA 1 April 2023
// Returns enrollments that do not yet contain a completionDate.
//
// These enrollments may be either paid or unpaid.
router.get("/", async (req, res) => {
  const enrollments = await Enrollment.find({
    completionDate: { $exists: false },
  }).sort("-enrollmentDate");
  res.send(enrollments);
});
// ============================================================
// GET ACTIVE AND UNPAID ENROLLMENTS
// ============================================================
// DA 1 April 2023
// Returns enrollments that:
//
// - do not yet have a completionDate
// - have not been paid
router.get(
  "/_enrolledNotCompletedNotPaid",
  async (req, res) => {
    const enrollments = await Enrollment.find({
      completionDate: { $exists: false },
      enrollmentPaid: false,
    }).sort("-enrollmentDate");
    res.send(enrollments);
  }
);
// ============================================================
// GET COMPLETED AND PAID ENROLLMENTS
// ============================================================
// DA 1 April 2023
// Returns enrollments that:
//
// - have a completionDate
// - have been paid
router.get("/_completedPaid", async (req, res) => {
  const enrollments = await Enrollment.find({
    completionDate: { $exists: true },
    enrollmentPaid: true,
  }).sort("-enrollmentDate");
  res.send(enrollments);
});
// ============================================================
// GET COMPLETED BUT UNPAID ENROLLMENTS
// ============================================================
// Returns enrollments that:
//
// - have a completionDate
// - have not yet been paid
router.get("/_completedNotPaid", async (req, res) => {
  const enrollments = await Enrollment.find({
    completionDate: { $exists: true },
    enrollmentPaid: false,
  }).sort("-enrollmentDate");
  res.send(enrollments);
});
// ============================================================
// GET ALL PAID ENROLLMENTS
// ============================================================
// DA 01 April 2023
// Returns every enrollment whose enrollmentPaid field is true,
// regardless of whether it has been completed.
router.get("/_enrollmentsPaid", async (req, res) => {
  const enrollments = await Enrollment.find({
    enrollmentPaid: true,
  }).sort("-enrollmentDate");
  res.send(enrollments);
});
// ============================================================
// CREATE A NEW ENROLLMENT
// ============================================================
//
// POST /api/enrollments
//
// Creates a new enrollment for a customer and product/course.
//
// The request body is expected to contain:
//
// {
//   customerId,
//   productId
// }
//
// This route is protected by authentication middleware.
//
// The operation:
//
// 1. Validates the incoming IDs.
// 2. Confirms that the customer exists.
// 3. Starts a MongoDB transaction.
// 4. Confirms that the product exists.
// 5. Retrieves the student's existing Enrollments.
// 6. Resolves those Enrollments to CURRENT Product/Course records.
// 7. Rejects the request if any current Course schedule conflicts.
// 8. Confirms that product stock is available.
// 9. Creates the enrollment.
// 10. Copies the Course schedule into the Enrollment snapshot.
// 11. Reduces product stock by one.
// 12. Commits the transaction.
//
// CALENDAR EVENT TIME EXTENSION:
//
// The Product model now contains:
//
// startTime
// endTime
//
// When the Enrollment is created, these values are copied
// from the selected Product into enrollment.product.
//
// This means the Enrollment preserves a snapshot of the
// Course's schedule at the time of enrollment.
//
// IMPORTANT:
//
// The times come from the Product retrieved from MongoDB.
//
// They DO NOT come directly from req.body.
//
// This ensures that the Enrollment receives the actual Course
// schedule stored by the application.
// ============================================================
router.post("/", auth, async (req, res) => {
  // ----------------------------------------------------------
  // 1. VALIDATE THE REQUEST
  // ----------------------------------------------------------
  //
  // validateEnrollment() currently validates:
  //
  // customerId
  // productId
  //
  // startTime and endTime are deliberately NOT part of the
  // incoming Enrollment request because the backend obtains
  // them from the selected Product.
  const { error } = validateEnrollment(req.body);
  if (error)
    return res
      .status(400)
      .send(error.details[0].message);
  // ----------------------------------------------------------
  // 2. RETRIEVE THE CUSTOMER
  // ----------------------------------------------------------
  const customer = await Customer.findById(
    req.body.customerId
  );
  // Do not create the Enrollment if the selected Customer
  // does not exist.
  if (!customer)
    return res.status(400).send("Invalid customer.");
  // ----------------------------------------------------------
  // 3. PREPARE THE MONGODB SESSION
  // ----------------------------------------------------------
  let session;
  try {
    // --------------------------------------------------------
    // 4. START TRANSACTION
    // --------------------------------------------------------
    //
    // The Enrollment creation and Product stock reduction
    // should either both succeed or both fail.
    session = await mongoose.startSession();
    session.startTransaction();
    // --------------------------------------------------------
    // 5. RETRIEVE THE SELECTED PRODUCT / COURSE
    // --------------------------------------------------------
    //
    // This Product now contains:
    //
    // startDate
    // endDate
    // startTime
    // endTime
    //
    // The Course scheduling information comes directly from
    // this database record.
    const product = await Product.findById(
      req.body.productId
    ).session(session);
    // Stop the transaction if the Product does not exist.
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send("Invalid product.");
    }

    // ========================================================
    // BACKEND SCHEDULING CONFLICT PROTECTION
    // ========================================================
    //
    // The React frontend already checks Course conflicts before
    // allowing Enrollment. That is useful for immediate feedback,
    // but the backend must enforce the same business rule because
    // an API request can be made without using the React form.
    //
    // The backend therefore performs its own authoritative check
    // inside this Enrollment-creation transaction.
    //
    // IMPORTANT:
    //
    // Existing Enrollment documents contain Product snapshots.
    // Those snapshots preserve historical information, but they
    // may be stale if a Course schedule was edited later.
    //
    // For conflict detection we therefore use:
    //
    //   Enrollment.product._id
    //
    // only to identify the Course, then retrieve the CURRENT
    // Product records and compare their current schedules.

    // --------------------------------------------------------
    // 6. RETRIEVE THIS STUDENT'S EXISTING ENROLLMENTS
    // --------------------------------------------------------
    //
    // Enrollment embeds the Customer ObjectId at customer._id.
    // Running this query in the same session keeps the scheduling
    // check within the transaction's database view.
    const existingEnrollments = await Enrollment.find({
      "customer._id": customer._id,
    }).session(session);

    // --------------------------------------------------------
    // 7. COLLECT EXISTING COURSE / PRODUCT IDS
    // --------------------------------------------------------
    //
    // Some legacy/bad records could theoretically be missing an
    // embedded Product ID. We do NOT silently interpret such a
    // record as conflict-free: the fail-closed check below rejects
    // creation if all current Course records cannot be resolved.
    const existingProductIds = existingEnrollments
      .map((existingEnrollment) =>
        existingEnrollment.product
          ? existingEnrollment.product._id
          : null
      )
      .filter(Boolean);

    if (existingProductIds.length !== existingEnrollments.length) {
      await session.abortTransaction();
      session.endSession();

      return res
        .status(409)
        .send(
          "Enrollment could not be created because one or more existing Course schedules could not be checked."
        );
    }

    // --------------------------------------------------------
    // 8. RETRIEVE CURRENT COURSE RECORDS IN ONE QUERY
    // --------------------------------------------------------
    //
    // Do NOT call Product.findById() once per Enrollment. Using
    // $in avoids an N+1 query pattern and retrieves all relevant
    // current Course records with one Product query.
    const existingProducts = await Product.find({
      _id: { $in: existingProductIds },
    }).session(session);

    // If an Enrollment references a Product that no longer exists,
    // the backend cannot establish that the proposed Enrollment is
    // safe. Fail closed instead of silently ignoring that Course.
    //
    // Use a Set because duplicate Enrollment records can refer to
    // the same Product ID. We care about distinct current Courses.
    const uniqueExistingProductIds = new Set(
      existingProductIds.map((productId) => String(productId))
    );

    const resolvedExistingProductIds = new Set(
      existingProducts.map((existingProduct) =>
        String(existingProduct._id)
      )
    );

    const allExistingProductsResolved =
      [...uniqueExistingProductIds].every((productId) =>
        resolvedExistingProductIds.has(productId)
      );

    if (!allExistingProductsResolved) {
      await session.abortTransaction();
      session.endSession();

      return res
        .status(409)
        .send(
          "Enrollment could not be created because one or more existing Course schedules could not be checked."
        );
    }

    // --------------------------------------------------------
    // 9. CHECK CURRENT COURSE SCHEDULES
    // --------------------------------------------------------
    //
    // This is deliberately the same overlap rule used by the
    // frontend.
    //
    // DATE RULE:
    //
    // Date ranges are inclusive. For example:
    //
    // Existing: 1 Oct -------- 10 Oct
    // New:             5 Oct -------- 15 Oct
    //
    // These overlap.
    //
    // TIME RULE:
    //
    // Times are zero-padded HH:mm strings, so chronological string
    // comparison works correctly.
    //
    // Strict comparisons allow schedules to touch at a boundary:
    //
    // Existing: 08:00 -------- 12:00
    // New:                     12:00 -------- 16:00
    //
    // This is NOT a conflict.
    //
    // A scheduling conflict exists only when BOTH the calendar
    // date range and the daily time range overlap.
    const conflictingProduct = existingProducts.find(
      (existingProduct) => {
        // Product validation normally guarantees all four fields.
        // Keep the POST route fail-closed if legacy/incomplete data
        // somehow exists in MongoDB.
        const hasCompleteSchedule =
          existingProduct.startDate &&
          existingProduct.endDate &&
          existingProduct.startTime &&
          existingProduct.endTime;

        if (!hasCompleteSchedule) {
          return false;
        }

        const datesOverlap =
          product.startDate <= existingProduct.endDate &&
          product.endDate >= existingProduct.startDate;

        const timesOverlap =
          product.startTime < existingProduct.endTime &&
          product.endTime > existingProduct.startTime;

        return datesOverlap && timesOverlap;
      }
    );

    // The .find() callback above returns false for an incomplete
    // current Product schedule, so detect incomplete schedules
    // separately and fail closed before considering the result safe.
    const hasIncompleteExistingSchedule = existingProducts.some(
      (existingProduct) =>
        !existingProduct.startDate ||
        !existingProduct.endDate ||
        !existingProduct.startTime ||
        !existingProduct.endTime
    );

    if (hasIncompleteExistingSchedule) {
      await session.abortTransaction();
      session.endSession();

      return res
        .status(409)
        .send(
          "Enrollment could not be created because one or more existing Course schedules could not be checked."
        );
    }

    // The selected Product should also have a complete schedule.
    // The Product schema requires these fields, but this defensive
    // check protects against legacy/inconsistent database records.
    const selectedProductHasCompleteSchedule =
      product.startDate &&
      product.endDate &&
      product.startTime &&
      product.endTime;

    if (!selectedProductHasCompleteSchedule) {
      await session.abortTransaction();
      session.endSession();

      return res
        .status(409)
        .send(
          "Enrollment could not be created because the selected Course schedule could not be checked."
        );
    }

    // --------------------------------------------------------
    // 10. REJECT A REAL SCHEDULING CONFLICT
    // --------------------------------------------------------
    //
    // HTTP 409 Conflict communicates that the request itself is
    // understandable, but creating the Enrollment conflicts with
    // the student's current Course schedule.
    if (conflictingProduct) {
      await session.abortTransaction();
      session.endSession();

      return res
        .status(409)
        .send(
          `Enrollment unavailable: the selected Course conflicts with the student's existing Course "${conflictingProduct.name}".`
        );
    }

    // --------------------------------------------------------
    // 11. CHECK PRODUCT / COURSE AVAILABILITY
    // --------------------------------------------------------
    //
    // Prevent enrollment when no available places remain.
    if (product.numberInStock === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send("Product not in stock.");
    }
    // --------------------------------------------------------
    // 12. CREATE THE ENROLLMENT
    // --------------------------------------------------------
    //
    // Customer and Product information is embedded directly
    // inside the Enrollment document.
    //
    // The Customer snapshot contains:
    //
    // customer._id
    // customer.name
    // customer.phone
    //
    // The Product snapshot contains:
    //
    // product._id
    // product.name
    // product.description
    // product.numberInStock
    // product.productPrice
    // product.startDate
    // product.endDate
    // product.startTime     <-- NEW
    // product.endTime       <-- NEW
    //
    // startTime and endTime preserve the daily Course
    // schedule that existed when this Enrollment was created.
    let enrollment = new Enrollment({
      // ------------------------------------------------------
      // CUSTOMER SNAPSHOT
      // ------------------------------------------------------
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
      },
      // ------------------------------------------------------
      // PRODUCT / COURSE SNAPSHOT
      // ------------------------------------------------------
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        numberInStock: product.numberInStock,
        productPrice: product.productPrice,
        // ----------------------------------------------------
        // COURSE DATE RANGE
        // ----------------------------------------------------
        //
        // These represent the first and last calendar dates
        // on which the Course takes place.
        startDate: product.startDate,
        endDate: product.endDate,
        // ====================================================
        // NEW: DAILY COURSE TIME RANGE
        // ====================================================
        //
        // Copy the Course's current start and end times from
        // the Product into the Enrollment's Product snapshot.
        //
        // Example:
        //
        // Product:
        //
        // startDate = 2026-10-01
        // endDate   = 2026-10-31
        // startTime = "08:00"
        // endTime   = "17:00"
        //
        // Enrollment.product will therefore contain:
        //
        // startDate = 2026-10-01
        // endDate   = 2026-10-31
        // startTime = "08:00"
        // endTime   = "17:00"
        //
        // These are stored as a snapshot. If the Product's
        // schedule is edited later, this Enrollment document
        // will not automatically change.
        startTime: product.startTime,
        endTime: product.endTime,
      },
      // ------------------------------------------------------
      // INITIAL ENROLLMENT FEE
      // ------------------------------------------------------
      //
      // Initially set the Enrollment fee equal to the current
      // Product/Course price.
      enrollmentFee: product.productPrice,
    });
    // --------------------------------------------------------
    // 13. SAVE THE ENROLLMENT
    // --------------------------------------------------------
    //
    // Save the Enrollment within the active transaction.
    //
    // Because models/enrollments.js now requires:
    //
    // product.startTime
    // product.endTime
    //
    // Mongoose will expect those values to be present here.
    enrollment = await enrollment.save({
      session,
    });
    // --------------------------------------------------------
    // 14. REDUCE AVAILABLE COURSE STOCK
    // --------------------------------------------------------
    product.numberInStock--;
    // Save the updated Product inside the same transaction.
    await product.save({
      session,
    });
    // --------------------------------------------------------
    // 15. COMMIT TRANSACTION
    // --------------------------------------------------------
    //
    // At this point:
    //
    // - the Enrollment has been created
    // - the Course stock has been reduced
    //
    // Both operations succeeded, so commit the transaction.
    await session.commitTransaction();
    session.endSession();
    // --------------------------------------------------------
    // 16. RETURN THE NEW ENROLLMENT
    // --------------------------------------------------------
    //
    // The response now contains:
    //
    // enrollment.product.startTime
    // enrollment.product.endTime
    //
    // in addition to the previously stored Course data.
    res.send(enrollment);
  } catch (ex) {
    // --------------------------------------------------------
    // TRANSACTION ERROR HANDLING
    // --------------------------------------------------------
    //
    // If anything fails while the transaction is active,
    // roll back the database changes.
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res
      .status(500)
      .send(
        "Enrollment Failed with undefined error."
      );
    // Re-throw so the existing application error-handling /
    // logging infrastructure can process the exception.
    throw ex;
  }
});
// ============================================================
// GET ALL ENROLLMENTS FOR ONE CUSTOMER
// ============================================================
//
// Customer Record Enrollments List feature.
//
// GET /api/enrollments/customer/:customerId
//
// Returns every Enrollment associated with one student/customer.
//
// Example:
//
// GET /api/enrollments/customer/653c13b19107cf006c530ca8
//
// The Enrollment schema does not contain a top-level:
//
// customerId
//
// Instead, Customer information is embedded in:
//
// enrollment.customer
//
// Therefore the Customer's ObjectId is stored at:
//
// enrollment.customer._id
//
// This route uses find() rather than findOne() because the
// Student page must receive ALL Enrollments belonging to the
// selected Customer.
//
// ------------------------------------------------------------
// CALENDAR EVENT TIME EXTENSION
// ------------------------------------------------------------
//
// NO FUNCTIONAL CHANGE IS REQUIRED TO THIS ENDPOINT.
//
// Enrollment.find() returns the complete Enrollment documents
// because this query does not use a field projection.
//
// Therefore, after Steps 3 and 4, each new Enrollment returned
// here can contain:
//
// enrollment.product._id
// enrollment.product.name
// enrollment.product.startDate
// enrollment.product.endDate
// enrollment.product.startTime
// enrollment.product.endTime
//
// This gives the frontend enough information to:
//
// 1. Identify which Courses the student is enrolled in.
// 2. Read the Enrollment's Course-schedule snapshot.
// 3. Obtain product._id so that the current Product record can
//    later be matched when performing scheduling-conflict
//    detection.
//
// IMPORTANT:
//
// For our later conflict detection feature, the current
// Product record will be treated as the authoritative Course
// schedule.
//
// The embedded Enrollment schedule remains useful as a
// historical/enrollment-time snapshot.
// ============================================================
router.get(
  "/customer/:customerId",
  async (req, res) => {
    // --------------------------------------------------------
    // EXTRACT CUSTOMER ID
    // --------------------------------------------------------
    const customerId = req.params.customerId;
    // --------------------------------------------------------
    // VALIDATE CUSTOMER ID
    // --------------------------------------------------------
    //
    // Validate the value before passing it to MongoDB.
    //
    // This prevents malformed values from reaching the query
    // and provides the frontend with a clean HTTP 400 response.
    if (
      !mongoose.Types.ObjectId.isValid(customerId)
    )
      return res
        .status(400)
        .send("The customer ID is invalid.");
    // --------------------------------------------------------
    // FIND THE CUSTOMER'S ENROLLMENTS
    // --------------------------------------------------------
    //
    // Find every Enrollment whose embedded customer._id
    // corresponds to the selected Student record.
    //
    // find() returns an array:
    //
    // [
    //   enrollment1,
    //   enrollment2,
    //   ...
    // ]
    //
    // If no Enrollment exists, MongoDB returns [].
    //
    // IMPORTANT:
    //
    // There is no .select() projection here.
    //
    // Therefore the complete embedded Product object is
    // returned, including startTime and endTime for records
    // that contain those fields.
    const enrollments = await Enrollment.find({
      "customer._id": customerId,
    }).sort("-enrollmentDate");
    // --------------------------------------------------------
    // RETURN ENROLLMENTS TO FRONTEND
    // --------------------------------------------------------
    //
    // The frontend can access, for example:
    //
    // enrollment.product._id
    // enrollment.product.name
    // enrollment.product.startDate
    // enrollment.product.endDate
    // enrollment.product.startTime
    // enrollment.product.endTime
    //
    // No additional API endpoint is necessary for this part
    // of the scheduling-conflict feature.
    res.send(enrollments);
  }
);
// ============================================================
// GET ONE ENROLLMENT BY ENROLLMENT ID
// ============================================================
//
// Retrieves one specific Enrollment document.
//
// Example:
//
// GET /api/enrollments/653c13b19107cf006c530ca8
//
// This route is also used by frontend functionality such as:
//
// getEnrollment(enrollmentId)
//
// and the Completion Form / Invoice workflow.
router.get("/:id", async (req, res) => {
  // Search MongoDB using the Enrollment document's own _id.
  const enrollment = await Enrollment.findById(
    req.params.id
  );
  // Return HTTP 404 if no matching Enrollment exists.
  if (!enrollment)
    return res
      .status(404)
      .send(
        "The enrollment with the given ID was not found."
      );
  // Return the matching Enrollment document.
  res.send(enrollment);
});
// Export this router so it can be mounted by the Express
// application's route/startup configuration.
module.exports = router;
