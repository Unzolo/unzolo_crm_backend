const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const validate = require('../middlewares/validate.middleware');
const { createBooking, addPayment } = require('../validations/booking.validation');
const authenticate = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const parseMultipartBody = require('../middlewares/parseMultipart.middleware');

router.use(authenticate);

router.post('/', upload.single('screenshot'), parseMultipartBody, validate(createBooking), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
router.post('/:id/payments', upload.single('screenshot'), parseMultipartBody, validate(addPayment), bookingController.addPaymentToBooking);

module.exports = router;
