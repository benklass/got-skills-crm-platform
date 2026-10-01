// _id: ObjectId,
// enrollmentId: ObjectId, // PayFast m_payment_id
// grossAmount: decimal, // PayFast amount_gross
// netAmount: decimal, // PayFast amount_net
// feeAmount: decimal, // PayFast amount_fee
// transacionDate: ISODate,
// isFullPayment: boolean, // Default true
// spTransactionId: string, // Service Provider Id - PayFast pf_payment_id
// paymentMethod: string, // pf_online
// serviceProvider: string // PayFast custom_str3
// merchantId: string // PayFast m_payment_id
// paymentStatus: string // PayFast payment_status
// signature: string // PayFast signature
// customerId: ObjectId // PayFast custom_str1
// productCode: string // PayFast custom_str2
// productInvoice: string // PayFast item_name
// productDescription: string // PayFast item_description
// confimationEmailAddress: string // PayFast email_address
// productId: string // PayFast custom_str4

const Joi = require("joi");
const mongoose = require("mongoose");
const moment = require("moment");

const paymentSchema = new mongoose.Schema({
  enrollmentId: {
    type: mongoose.ObjectId,
    required: true,
    minlength: 3,
    maxlength: 24,
  },
  customerId: {
    type: mongoose.ObjectId,
    required: true,
    minlength: 3,
    maxlength: 24,
  },
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  productCode: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 24,
  },
  productInvoice: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  productDescription: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  confimationEmailAddress: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  grossAmount: {
    type: mongoose.Decimal128,
    required: true,
    min: 0,
    max: 9999999,
  },
  netAmount: {
    type: mongoose.Decimal128,
    required: true,
    min: 0,
    max: 9999999,
  },
  feeAmount: {
    type: mongoose.Decimal128,
    required: true,
    min: 0,
    max: 9999999,
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isFullPayment: {
    type: Boolean,
    required: true,
    default: true,
  },
  spTransactionId: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  paymentMethod: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  serviceProvider: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  merchantId: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  paymentStatus: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  signature: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
});

// DA 6 03 2023 Add the enrollmentId for the lookup to fix bug where two enrollments with same customer & product can not be processed.
// DA 7 03 2023 Bug fix for the enrollmentId field changed from "._id" to _id
paymentSchema.statics.lookup = function (enrollmentId, customerId) {
  return this.findOne({
    enrollmentId,
    customerId,
  });
};

// DA 28 02 2023 Add check for enrollment for customers if yes dont detele the customer
//
paymentSchema.statics.paymentLookup = function (customerId) {
  return this.findOne({
    customerId,
  });
};

// DA 02 03 2023 Add check for enrollment for products if yes dont detele the Product
//
paymentSchema.statics.paymentLookupProduct = function (productId) {
  return this.findOne({
    "product._id": productId,
  });
};

paymentSchema.methods.payment = function () {
  this.transactionDate = new Date();
  // TO DO Add any extra charges here on the completion of the enrollment if needed.
  const enrollmentDays = moment().diff(this.enrollmentDate, "days");
  // this.enrollmentFee = enrollmentDays * this.product.productPrice;
  if (!this.enrollmentFee) {
    this.enrollmentFee = this.product.productPrice;
  }
};

const Payment = mongoose.model("Payment", paymentSchema);

function validatePayment(payment) {
  const schema = {
    enrollmentId: Joi.objectId().required(),
    customerId: Joi.objectId().required(),
    name: Joi.string().min(5).max(50).required(),
    productCode: Joi.string().min(5).max(25).required(),
    productInvoice: Joi.string(5).max(50).required(), // inVoiceNo (date number)
    productDescription: Joi.string(5).max(50).required(), // productCode + productDescription
    confimationEmailAddress: Joi.string(5).max(50).email().required(),
    grossAmount: Joi.number().min(0).required(),
    netAmount: Joi.number().min(0).required(),
    feeAmount: Joi.number().min(0).required(),
    transactionDate: Joi.date().required(),
    isFullPayment: Joi.boolean(),
    spTransactionId: Joi.string().min(5).max(50).required(),
    paymentMethod: Joi.string().min(2).max(50).required(),
    serviceProvider: Joi.string().min(2).max(50).required(),
    merchantId: Joi.string().min(2).max(50).required(),
    paymentStatus: Joi.string().min(2).max(50).required(),
    signature: Joi.string().min(2).max(50).optional(),
  };

  return Joi.validate(payment, schema);
}

exports.Payment = Payment;
exports.validatePayment = validatePayment;
