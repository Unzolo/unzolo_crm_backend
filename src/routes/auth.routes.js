const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { register, login, verifyOtp, resendOtp } = require('../validations/auth.validation');

router.post('/register', validate(register), authController.register);
router.post('/verify-otp', validate(verifyOtp), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtp), authController.resendOtp);
router.post('/login', validate(login), authController.login);



module.exports = router;
