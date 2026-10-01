// API server using Express
// Packs API
const winston = require("winston");
const express = require("express");
const cors = require("cors"); // This package is used for http origin requests
const app = express(); // This is configured express methods (HTTP server) once and sent as argument to all modules

require("./startup/logging")();
require("./startup/routes")(app); // This calls the routes.js, handles all HTTP endpoints, module with the (app) object
require("./startup/db")();
require("./startup/config")();
require("./startup/validation")();
require("./startup/prod")(app);

// Catch uncaughtExceptions - Replace this with winston methode
// process.on('uncaughtException', (ex) =>{
//     console.log('APP GOT AN UNCAUGHT EXCEPTION...');
//     winston.error(ex.message, ex);
//     process.exit(1);
// });

//throw new Error('Something failed during startup...');
// const p = Promise.reject( new Error('Something failed miserably ....'));
// p.then(() => console.log('Done'));

// Setup CORS parameters
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE"],
};

//app.use(cors(corsOptions));

app.use(cors(corsOptions), function (req, res, next) {
  //console.log('Logging...');
  next();
});

// APP GET
app.get("/", (req, res) => {
  res.send("Hello World PACKS API?");
});

// When PORT is set
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}`)
); // setting the server up on a listening port

module.exports = server; // Export this function for the ingetration tests
