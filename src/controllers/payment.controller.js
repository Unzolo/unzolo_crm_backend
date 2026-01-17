const paymentService = require('../services/payment.service');
const { success, error } = require('../utils/response');

const createPayment = async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    return success(res, payment, 'Payment recorded successfully', 201);
  } catch (err) {
    if (err.message === 'Booking not found') {
      return error(res, err.message, 404);
    }
    return error(res, err.message, 500);
  }
};

const getPaymentsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const payments = await paymentService.getPaymentsByBooking(bookingId);
    return success(res, payments, 'Payments retrieved successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  createPayment,
  getPaymentsByBooking,
};
