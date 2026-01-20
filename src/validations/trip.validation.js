const Joi = require('joi');

const createTrip = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  destination: Joi.string().required(),
  advanceAmount: Joi.number().min(0).optional(),
  type: Joi.string().valid('package', 'camp').optional(),
  startDate: Joi.date().iso().optional().allow(null),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().allow(null),
  capacity: Joi.number().integer().min(1).optional(),
  groupSize: Joi.string().optional().allow(''),
  category: Joi.string().optional().allow(''),
});

const updateTrip = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  destination: Joi.string().optional(),
  advanceAmount: Joi.number().min(0).optional(),
  type: Joi.string().valid('package', 'camp').optional(),
  startDate: Joi.date().iso().optional().allow(null),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().allow(null),
  capacity: Joi.number().integer().min(1).optional(),
  groupSize: Joi.string().optional().allow(''),
  category: Joi.string().optional().allow(''),
});

module.exports = {
  createTrip,
  updateTrip,
};
