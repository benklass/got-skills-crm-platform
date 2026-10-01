const winston = require("winston"); // this a logging libuary
require("winston-mongodb"); // only need to require not needed to set to object used in adding a Transport
require("express-async-errors");

module.exports = function () {
  // use winston to log expection to the file system as a database may not be available during these times.
  winston.handleExceptions(
    new winston.transports.Console({ colorize: true, prettyPrint: true }),
    new winston.transports.File({ filename: "uncaughtExceptions.log" })
  );
  // unhandleRejections are not available in winston as a method (as above) so here is a hack to get it there
  process.on("unhandledRejection", (ex) => {
    throw ex;
  });

  // Error logging to file etc... using winston
  winston.add(winston.transports.File, { filename: "logfile.log" }); // Add transport to winston - console is default.
  winston.add(winston.transports.MongoDB, {
    db: "mongodb://nodejs:nodejsUSER@localhost:27017/packs",
    level: "error",
  });
};
