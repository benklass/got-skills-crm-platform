const mongoose = require("mongoose");
const config = require("config");

const db = "mongodb://".concat(config.get("mongodb_user"), config.get("db")); // user to have user:pass

console.log(db);

const enrollmentPaymentSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  enrollmentFee: { type: String },
  enrollmentPaid: { type: String },
  enrollmentDate: { type: Date },
  completionDate: { type: Date },
  payments: [
    {
      grossAmount: {
        type: mongoose.Decimal128,
      },
      transactionDate: {
        type: Date,
      },
      spTransactionId: {
        type: String,
      },
      serviceProvider: {
        type: String,
      },
      productInvoice: {
        type: String,
      },
      productCode: {
        type: String,
      },
    },
  ],
});

async function connectDb() {
  await mongoose.connect(db);
}

async function returnRecords() {
  const payments = await EnrollmentPayment.find({});
  // console.log("here is returnRecords", payments);

  payments.forEach((payment) => {
    console.log("Payment Details:");
    payment.payments.forEach((paymentItem, index) => {
      //console.log(`Payment ${index + 1}:`);
      Object.entries(paymentItem).forEach(([key, value]) => {
        console.log(`${key}:`, value);
      });
    });
  });
}

const EnrollmentPayment = mongoose.model(
  "enrollment-payments",
  enrollmentPaymentSchema
);

try {
  connectDb();
  returnRecords();
} catch (ex) {
  console.log("Error occured", ex);
}

// var MongoClient = require("mongodb").MongoClient;

// mongoose.connect(db, function (err, db) {
//   if (err) throw err;
//   var dbo = db.db("packs");
//   var query = { name: "Batman" };
//   dbo
//     .collection("enrollment")
//     .find()
//     .toArray(function (err, result) {
//       if (err) throw err;
//       console.log(result);

//     });
// });
