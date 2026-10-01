const express = require("express");
const { Customer, validateCustomers } = require("../models/customers");
const { Enrollment } = require("../models/enrollments");
const router = express.Router();

// The Routes start here

router.get("/", async (req, res) => {
  const customers = await Customer.find().sort("name");
  res.send(customers);
});

// /api/customers/:id

router.get("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer)
    return res
      .status(404)
      .send("The customer with the given ID was not found!"); // 404
  res.send(customer);
});

// App POST

router.post("/", async (req, res) => {
  const { error } = validateCustomers(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  let customer = new Customer({
    name: req.body.name,
    grade: req.body.grade,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    comments: req.body.comments,
    active: req.body.active,
  });

  try {
    customer = await customer.save();
    res.send(customer);
  } catch (error) {
    console.log("Error creating user", error.message);
  }
});

// App PUT

router.put("/:id", async (req, res) => {
  // Validate
  // If invalid, return 400 - Bad request
  const { error } = validateCustomers(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      grade: req.body.grade,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      comments: req.body.comments,
      active: req.body.active,
    },
    {
      new: true,
    }
  );
  // Update customer
  // Return the updated customer
  if (!customer)
    return res
      .status(404)
      .send("The customer with the given ID was not found!"); // 404

  res.send(customer);
});

// App HTTP DELETE

router.delete("/:id", async (req, res) => {
  // Look up enrollment
  // Enrollment existing, return 400
  // DA 28 02 2023 Add check if Customer has a enrollment, if yes then don't delete.
  // Added enrollmentLookup in model/enrollments.js
  //
  const enrollment = await Enrollment.enrollmentLookup(req.params.id);

  if (enrollment)
    return res
      .status(400)
      .send(
        "Student has a enrollment unable to process, complete enrollment before delete."
      );

  // Look up the customers
  // Not existing, return 404
  const customer = await Customer.findByIdAndRemove(req.params.id);
  if (!customer)
    return res
      .status(404)
      .send("The customer with the given ID was not found!"); // 404

  // Return the same customer
  res.send(customer);
});

module.exports = router;
