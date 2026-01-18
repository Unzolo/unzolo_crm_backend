const bookingService = require('../services/booking.service');
const { success, error } = require('../utils/response');

const { uploadToCloudinary } = require('../utils/cloudinary');

const createBooking = async (req, res) => {
  try {
    console.log('--- Debug: Create Booking ---');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    let screenshotUrl = null;
    if (req.file) {
      console.log('File detected, uploading to Cloudinary...');
      screenshotUrl = await uploadToCloudinary(req.file.path);
      console.log('Cloudinary URL:', screenshotUrl);
    } else {
      console.log('No file detected in req.file');
    }
    
    // Merge screenshotUrl into body
    const bookingData = { ...req.body, screenshotUrl };

    const booking = await bookingService.createBooking(bookingData, req.user.id);
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
    console.log('--- Debug: Add Payment ---');
    console.log('req.file:', req.file);
    
    let screenshotUrl = null;
    if (req.file) {
      console.log('File detected, uploading to Cloudinary...');
      screenshotUrl = await uploadToCloudinary(req.file.path);
      console.log('Cloudinary URL:', screenshotUrl);
    } else {
       console.log('No file detected');
    }

    const paymentData = { ...req.body, screenshotUrl };
    const payment = await bookingService.addPaymentToBooking(req.params.id, paymentData, req.user.id);
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
