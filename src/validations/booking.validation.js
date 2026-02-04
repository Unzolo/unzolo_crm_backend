const Joi = require('joi');

const createBooking = Joi.object({
  tripId: Joi.string().uuid().required(),
  paymentType: Joi.string().valid('full', 'advance', 'custom').required(),
  amount: Joi.number().min(0).optional(), // Used only if paymentType is 'custom'
  customAmount: Joi.number().min(0).optional(), // Alias for amount
  paymentMethod: Joi.string().required(),
  transactionId: Joi.string().optional(),
  paymentDate: Joi.date().iso().required(), // Enforce payment date
  memberCount: Joi.number().integer().min(1).optional(),
  preferredDate: Joi.date().iso().optional().allow(null),
  totalPackagePrice: Joi.number().min(0).optional(),
  concessionAmount: Joi.number().min(0).optional().default(0),
  members: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      age: Joi.number().integer().min(0).required(),
      contactNumber: Joi.string().optional(),
      isPrimary: Joi.boolean().default(false),
      place: Joi.string().optional().allow('', null),
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
  concessionAmount: Joi.number().min(0).optional(),
});

const cancelBooking = Joi.object({
  memberIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  refundAmount: Joi.number().min(0).optional(),
  cancellationReason: Joi.string().optional(),
  paymentMethod: Joi.string().optional(),
  paymentDate: Joi.date().iso().required(),
})
.custom((value, helpers) => {
    if (value.refundAmount > 0 && !value.paymentMethod) {
        return helpers.message('Payment method is required when there is a refund amount');
    }
    return value;
});

module.exports = {
  createBooking,
  addPayment,
  cancelBooking,
};
