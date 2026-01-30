const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiry.controller');
const validate = require('../middlewares/validate.middleware');
const { createEnquiry, updateEnquiry } = require('../validations/enquiry.validation');
const authenticate = require('../middlewares/auth.middleware');
const checkSubscription = require('../middlewares/subscription.middleware');

router.use(authenticate);

router.post('/', checkSubscription, validate(createEnquiry), enquiryController.createEnquiry);
router.get('/', enquiryController.getEnquiries);
router.get('/:id', enquiryController.getEnquiryById);
router.patch('/:id', checkSubscription, validate(updateEnquiry), enquiryController.updateEnquiry);
router.delete('/:id', checkSubscription, enquiryController.deleteEnquiry);

module.exports = router;
