const express = require("express");
const cors = require("cors");

const instructors = require("../routes/instructors");
const customers = require("../routes/customers");
const products = require("../routes/products");
const enrollments = require("../routes/enrollments");
const users = require("../routes/users");
const auth = require("../routes/auth");
const completions = require("../routes/completions");
const payments = require("../routes/payments");
const error = require("../middleware/error");

// Setup CORS parameters
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE"],
};

const corsOptionsPayments = {
  origin: ["/.payfast/.co/.za$"],
  methods: ["GET", "PUT", "POST"],
};

module.exports = function (app) {
  app.use(cors(corsOptions), express.json()); // req.body object populated from the request to handle JSON type HTTP calls
  app.use("/api/instructors/", cors(corsOptions), instructors); // This tells express to route to intructors module
  app.use("/api/customers/", cors(corsOptions), customers); // This tells express to route to customers module
  app.use("/api/products", cors(corsOptions), products); // This tells express to route to products module
  app.use("/api/enrollments/", cors(corsOptions), enrollments); // This tells express to route to enrollments module
  app.use("/api/users/", cors(corsOptions), users); // This tells express to route to users module
  app.use("/api/auth/", cors(corsOptions), auth); // This tells express to route to auth module
  app.use("/api/completions/", cors(corsOptions), completions); // This tells express to route to completions module

  app.use(
    "/api/payments/",
    express.urlencoded({ extended: true }),
    cors(corsOptionsPayments),
    payments
  ); // This tells express to route to payments module
  app.use(error); // This handles all Errors, Error handling function in Express ONLY
};
