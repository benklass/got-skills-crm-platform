const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');


module.exports = function () {
    const db = 'mongodb://'.concat(config.get('mongodb_user'),config.get('db'));  // user to have user:pass
    console.log(db);
    const dispdb = db.split('@'); // use split to only display the database not user details.
    mongoose.connect(db)
    .then(() => winston.info(`Connected to ${dispdb[1]}...`));
    // no need to catch the err as this is handled with exceptions handles
};