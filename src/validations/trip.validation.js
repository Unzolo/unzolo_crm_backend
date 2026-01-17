const Joi = require('joi');

const createTrip = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  destination: Joi.string().required(),
  advanceAmount: Joi.number().min(0).optional(),
  type: Joi.string().valid('package', 'camp').optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  capacity: Joi.number().integer().min(1).optional(),
});

const updateTrip = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  destination: Joi.string().optional(),
  advanceAmount: Joi.number().min(0).optional(),
  type: Joi.string().valid('package', 'camp').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  capacity: Joi.number().integer().min(1).optional(),
});

module.exports = {
  createTrip,
  updateTrip,
};
