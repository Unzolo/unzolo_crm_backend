const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', customerController.getCustomers);

module.exports = router;
