const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const validate = require('../middlewares/validate.middleware');
const { createBooking } = require('../validations/booking.validation');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

router.post('/', validate(createBooking), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);

module.exports = router;
