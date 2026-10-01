const config = require("config");

module.exports = function () {
  // Check environment variables here
  if (!config.get("jwtPrivateKey")) {
    console.error("FATAL ERROR: jwtPrivateKey is not defined.");
    process.exit(1);
  }
  if (!config.get("mongodb_user")) {
    console.error("FATAL ERROR: Database credentials not defined.");
    process.exit(1);
  }
};
