const Joi = require("joi");
const mongoose = require("mongoose");
const validate = require("../middleware/validate");
const winston = require("winston");

const { Enrollment } = require("../models/enrollments");
// TO DELETE const { Product } = require("../models/products");

const { Payment } = require("../models/payments");
const auth = require("../middleware/auth");

const express = require("express");
const router = express.Router();

// Routes start here

router.get("/", auth, async (req, res) => {
  const payments = await Payment.find().sort("-productInvoice");

  res.send(payments);
});

// Retrieve all payments for the specified customer, sorted by most recent transaction date.
router.get("/customer/:customerId", auth, async (req, res) => {
  const customerId = req.params.customerId;

  if (!mongoose.Types.ObjectId.isValid(customerId))
    return res.status(400).send("The customer ID is invalid.");

  const payments = await Payment.find({
    customerId: customerId,
  }).sort("-transactionDate");

  res.send(payments);
});

router.get("/:id", auth, async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment)
    return res.status(404).send("The payment with the given ID was not found.");

  res.send(payment);
});

router.get("/enrollment/:enrollmentId", auth, async (req, res) => {
  const payment = await Payment.findOne({
    enrollmentId: req.params.enrollmentId,
  });

  if (!payment)
    return res
      .status(404)
      .send("The payment with the enrollment ID was not found.");

  res.send(payment);
});

// New payment from PayFast(external Service Provider) & manual payment
router.post("/", [validate(validatePayment)], async (req, res) => {
  const { error } = validatePayment(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const enrollment = await Enrollment.lookup(
    req.body.m_payment_id,
    req.body.custom_str1
    //req.body.custom_str4
  );

  if (!enrollment) return res.status(404).send("Enrollment not found.");

  let payment = new Payment({
    enrollmentId: req.body.m_payment_id,
    customerId: req.body.custom_str1,
    name: req.body.name_first, // customer name
    productCode: req.body.custom_str2,
    productInvoice: req.body.item_name, // invoiceNo
    productDescription: req.body.item_description,
    confimationEmailAddress: req.body.email_address,
    grossAmount: req.body.amount_gross,
    netAmount: req.body.amount_net,
    feeAmount: req.body.amount_fee,
    transactionDate: new Date(),
    isFullPayment: true,
    spTransactionId: req.body.pf_payment_id,
    paymentMethod: "EFT",
    serviceProvider: req.body.custom_str3,
    merchantId: req.body.merchant_id,
    paymentStatus: req.body.payment_status,
    signature: req.body.signature,
  });

  if (enrollment.enrollmentPaid) {
    winston.error(
      "Failed Post Payment Received for Enrollment Paid :" + payment
    );
    return res.status(400).send("Enrollment already paid.");
    //return res.status(400).send(rental._id);
  }

  // Save the enrollmentPaid to the Database
  // Save the payment to the Database

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Perform the operations within the transaction
    payment = await payment.save({ session });
    await Enrollment.updateOne(
      { _id: enrollment._id },
      { enrollmentPaid: true },
      { session }
    );

    // If both operations succeed, commit the transaction
    await session.commitTransaction();
    session.endSession();
    winston.info("Successful Payment Received for Enrollment :" + payment);
    return res.status(200).send("Transaction Successful");
  } catch (err) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();

    return res.status(500).send("Transaction aborted. Error occurred: " + err);
  }
});

function validatePayment(req) {
  console.log("here in routes/payments.js - validatePayment :", req);
  const schema = {
    // Objects
    m_payment_id: Joi.objectId().required(), // enrollmentId
    custom_str1: Joi.objectId().required(), // customerId
    name_first: Joi.string().required(), // name
    //custom_str4: Joi.objectId().required(), // productId

    // Numbers
    amount_fee: Joi.number().required(), // service Provider Fee
    amount_gross: Joi.number().required(), // enrollmentFee
    amount_net: Joi.number().required(), // enrollmentFee less service Provider Fee

    // Strings
    custom_str2: Joi.string().required(), // productCode
    custom_str3: Joi.string().required(), // serviceProvider
    item_name: Joi.string().required(), // productInvoice invoiceNo
    item_description: Joi.string().required(), // productCode + productDescription
    email_address: Joi.string().required(), // Confimaton Email Address
    payment_status: Joi.string().required(),
    merchant_id: Joi.string().required(), // PayFast merchant Id
    pf_payment_id: Joi.string().required(), // PayFast payment Id
    signature: Joi.string().required(), // Hash signature

    // Optional Not Used - PayFast Notify
    custom_str4: Joi.string().allow("").optional(),
    custom_str5: Joi.string().allow("").optional(),
    custom_int1: Joi.number().allow("").optional(),
    custom_int2: Joi.number().allow("").optional(),
    custom_int3: Joi.number().allow("").optional(),
    custom_int4: Joi.number().allow("").optional(),
    custom_int5: Joi.number().allow("").optional(),
    name_last: Joi.string().allow("").optional(),
  };

  return Joi.validate(req, schema);
}

module.exports = router;
