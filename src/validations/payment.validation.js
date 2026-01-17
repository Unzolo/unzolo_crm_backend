const Joi = require('joi');
const { PAYMENT_STATUS } = require('../utils/constants');

const createPayment = Joi.object({
  bookingId: Joi.string().uuid().required(),
  amount: Joi.number().min(0).required(),
  method: Joi.string().required().description('e.g., gpay, cash, credit_card'),
  transactionId: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(PAYMENT_STATUS)).default(PAYMENT_STATUS.PENDING),
  paymentDate: Joi.date().iso().default(Date.now),
  screenshotUrl: Joi.string().uri().optional(),
});

module.exports = {
  createPayment,
};
