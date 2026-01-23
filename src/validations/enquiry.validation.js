const Joi = require('joi');
const { ENQUIRY_STATUS } = require('../utils/constants');

const createEnquiry = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  notes: Joi.string().optional().allow(''),
  status: Joi.string().valid(...Object.values(ENQUIRY_STATUS)).optional(),
  followUpDate: Joi.date().iso().optional().allow(null),
});

const updateEnquiry = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  notes: Joi.string().optional().allow(''),
  status: Joi.string().valid(...Object.values(ENQUIRY_STATUS)).optional(),
  followUpDate: Joi.date().iso().optional().allow(null),
});

module.exports = {
  createEnquiry,
  updateEnquiry,
};
