const bookingService = require('../services/booking.service');
const { success, error } = require('../utils/response');

const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.body, req.user.id);
    return success(res, booking, 'Booking created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getBookings = async (req, res) => {
  try {
    const { tripId } = req.query;
    const bookings = await bookingService.getBookings(req.user.id, tripId);
    return success(res, bookings);
  } catch (err) {
    return error(res, err.message);
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.id);
    if (!booking) return error(res, 'Booking not found', 404);
    return success(res, booking);
  } catch (err) {
    return error(res, err.message);
  }

};

const addPaymentToBooking = async (req, res) => {
  try {
    const payment = await bookingService.addPaymentToBooking(req.params.id, req.body, req.user.id);
    return success(res, payment, 'Payment added successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  addPaymentToBooking,
};
