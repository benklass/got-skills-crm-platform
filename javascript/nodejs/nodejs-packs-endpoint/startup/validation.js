const Joi = require('joi');

module.exports = function () {

    Joi.objectId = require('joi-objectid')(Joi); // this is a function used for objectId validation added to Joi
};