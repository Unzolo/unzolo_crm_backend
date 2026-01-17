const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const validate = require('../middlewares/validate.middleware');
const { createPayment } = require('../validations/payment.validation');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

router.post('/', validate(createPayment), paymentController.createPayment);
router.get('/booking/:bookingId', paymentController.getPaymentsByBooking);

module.exports = router;
