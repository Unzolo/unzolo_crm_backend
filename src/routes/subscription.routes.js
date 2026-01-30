const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

// Buy Premium Plan (Create Razorpay Order)
router.post('/create-order', subscriptionController.createOrder);

// Verify Razorpay Payment
router.post('/verify-payment', subscriptionController.verifyPayment);

module.exports = router;
