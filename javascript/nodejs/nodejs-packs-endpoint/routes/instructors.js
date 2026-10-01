const express = require("express");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Delete const { Genre, validateGenre } = require("../models/genres");
const { Instructor, validateInstructor } = require("../models/instructors");
const router = express.Router();

// Setup CORS parameters
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE"],
};

router.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const instructors = await Instructor.find().sort("name");
    res.send(instructors);
  })
);

// /api/instructor/1

router.get(
  "/:id",
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const instructor = await Instructor.findById(req.params.id);

    if (!instructor)
      return res
        .status(404)
        .send("The Instructor with the given ID was not found!"); // 404 moved to error.js

    res.send(instructor);
  })
);

// App POST - use auth middleware function to verify user

router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateInstructor(req.body);
    if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

    let instructor = new Instructor({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      active: req.body.active,
    });
    instructor = await instructor.save();
    res.send(instructor);
  })
);

// App PUT

router.put("/:id", async (req, res) => {
  // Validate
  // If invalid, return 400 - Bad request
  const { error } = validateInstructor(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  const instructor = await Instructor.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      active: req.body.active,
    },
    {
      new: true,
    }
  );
  // Update instructor
  // Return the updated instructor
  if (!instructor)
    return res
      .status(404)
      .send("The instructor with the given ID was not found!"); // 404

  res.send(instructor);
});

// App HTTP DELETE
// parameters path, middleware, req, res, next
router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up the instructors
  // Not existing, return 404
  const instructor = await Instructor.findByIdAndRemove(req.params.id);
  if (!instructor)
    return res
      .status(404)
      .send("The instructor with the given ID was not found!"); // 404

  // Return the same instructor
  res.send(instructor);
});

module.exports = router;
