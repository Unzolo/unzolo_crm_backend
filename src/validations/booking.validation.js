const Joi = require('joi');

const createBooking = Joi.object({
  tripId: Joi.string().uuid().required(),
  paymentType: Joi.string().valid('full', 'advance', 'custom').required(),
  amount: Joi.number().min(0).optional(), // Used only if paymentType is 'custom'
  customAmount: Joi.number().min(0).optional(), // Alias for amount
  paymentMethod: Joi.string().required(),
  transactionId: Joi.string().optional(),
  paymentDate: Joi.date().iso().required(), // Enforce payment date
  members: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      age: Joi.number().integer().min(0).required(),
      contactNumber: Joi.string().optional(),
      isPrimary: Joi.boolean().default(false),
    })
  ).min(1).required()
  .custom((value, helpers) => {
    const primaries = value.filter(m => m.isPrimary);
    if (primaries.length !== 1) {
      return helpers.message('Exactly one member must be marked as primary');
    }
    if (!primaries[0].contactNumber) {
      return helpers.message('Primary member must have a contact number');
    }
    if (!primaries[0].contactNumber) {
      return helpers.message('Primary member must have a contact number');
    }
    return value;
  })
  .custom((value, helpers) => {
    if (value.paymentType === 'custom' && !value.amount && !value.customAmount) {
        return helpers.message('Amount is required when payment type is custom');
    }
    return value;
  }),
});

const addPayment = Joi.object({
  paymentType: Joi.string().valid('balance', 'custom').required(),
  amount: Joi.number().min(0).when('paymentType', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  paymentMethod: Joi.string().required(),
  transactionId: Joi.string().optional(),
  paymentDate: Joi.date().iso().required(),
});

module.exports = {
  createBooking,
  addPayment,
};
