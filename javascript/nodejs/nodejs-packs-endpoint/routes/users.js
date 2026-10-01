const auth = require("../middleware/auth");

const bcrypt = require("bcrypt");
const _ = require("lodash");

const { User, validateUser } = require("../models/user");
const express = require("express");
const router = express.Router();

// DA 15-04-2023 Async function to encrypt password
async function encryptPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

// DA 09-04-2023 Get users for User management
router.get("/", auth, async (req, res) => {
  const users = await User.find().sort("name");
  res.send(users);
});

router.get("/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user)
    return res.status(404).send("The user with the given ID was not found!"); // 404
  res.send(user);
});

// DA 09-04-2023 Post user update details.

router.post("/", async (req, res) => {
  const { error } = validateUser(req.body);

  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User Already registered.");

  user = new User(
    _.pick(req.body, [
      "name",
      "email",
      "password",
      "isAdmin",
      "isInstructor",
      "isStudent",
      "isParent",
      "linkInstructorId",
      "linkStudentId",
    ])
  ); // use _pick(lodash) to only select what you need from arrays

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  try {
    await user.save();

    const token = user.generateAuthToken();
    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token") // set this to allow the client to see the header
      .send(_.pick(user, ["_id", "name", "email"]));
  } catch (ex) {
    //console.log("In catch block users.js in routes : ex -", ex, user);
    return res.send(ex.statusText);
    // return res.send(ex.response.statusText)
  }
});

// DA 09-04-2023 Added change user details and user type

router.put("/:id", async (req, res) => {
  // Validate
  // If invalid, return 400 - Bad request
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  // DA 15-04-2023 Encrypt the password using bcrypt
  const hashedPassword = await encryptPassword(req.body.password);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword, // save hashed password in the database
      isAdmin: req.body.isAdmin,
      isStudent: req.body.isStudent,
      isInstructor: req.body.isInstructor,
      isParent: req.body.isParent,
      linkInstructorId: req.body.linkInstructorId,
      linkStudentId: req.body.linkStudentId,
    },
    {
      new: true,
    }
  );
  // Update customer
  // Return the updated customer
  if (!user)
    return res.status(404).send("The user with the given ID was not found!"); // 404

  res.send(user);
});

module.exports = router;
