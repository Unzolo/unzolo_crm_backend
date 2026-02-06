const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiry.controller');
const validate = require('../middlewares/validate.middleware');
const { createEnquiry, updateEnquiry } = require('../validations/enquiry.validation');
const authenticate = require('../middlewares/auth.middleware');


router.use(authenticate);

router.post('/', validate(createEnquiry), enquiryController.createEnquiry);
router.get('/', enquiryController.getEnquiries);
router.get('/:id', enquiryController.getEnquiryById);
router.patch('/:id', validate(updateEnquiry), enquiryController.updateEnquiry);
router.delete('/:id', enquiryController.deleteEnquiry);

module.exports = router;
