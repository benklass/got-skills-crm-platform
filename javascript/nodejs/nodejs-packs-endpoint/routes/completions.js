const Joi = require("joi");
const mongoose = require("mongoose");
const validate = require("../middleware/validate");
const { Enrollment } = require("../models/enrollments");
const { Product } = require("../models/products");
const auth = require("../middleware/auth");
const express = require("express");
const router = express.Router();

router.post("/", [auth, validate(validateCompletion)], async (req, res) => {
  const { error } = validateCompletion(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const enrollment = await Enrollment.lookup(
    req.body.enrollmentId,
    req.body.customerId,
    req.body.productId
  );

  if (!enrollment) return res.status(404).send("Enrollment not found.");

  if (enrollment.completionDate) {
    return res.status(400).send("Completion already processed.");
    //return res.status(400).send(rental._id);
  }

  // Use the Schema completion function to calculate the course enrollment fee.
  // enrollment fee product Price
  enrollment.completion();

  // Save the enrollment to the Database

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Perform the operations within the transaction
    await enrollment.save({ session });
    await Product.updateOne(
      { _id: enrollment.product._id },
      { $inc: { numberInStock: 1 } },
      { session }
    );

    // If both operations succeed, commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).send(enrollment);
  } catch (err) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();

    return res.status(500).send("Transaction aborted. Error occurred: " + err);
  }
});

function validateCompletion(req) {
  const schema = {
    enrollmentId: Joi.objectId().required(),
    customerId: Joi.objectId().required(),
    productId: Joi.objectId().required(),
  };

  return Joi.validate(req, schema);
}

module.exports = router;
