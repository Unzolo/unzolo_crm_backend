const { Payment, Booking } = require('../models');

const createPayment = async (data) => {
  // Check if booking exists
  const booking = await Booking.findByPk(data.bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  const payment = await Payment.create(data);
  return payment;
};

const getPaymentsByBooking = async (bookingId) => {
  return await Payment.findAll({
    where: { bookingId },
    order: [['paymentDate', 'DESC']],
  });
};

module.exports = {
  createPayment,
  getPaymentsByBooking,
};
