const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { register, login, verifyOtp, resendOtp, changePassword, forgotPassword, resetPassword } = require('../validations/auth.validation');
const authenticate = require('../middlewares/auth.middleware');

router.post('/register', validate(register), authController.register);
router.post('/verify-otp', validate(verifyOtp), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtp), authController.resendOtp);
router.post('/login', validate(login), authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.post('/change-password', authenticate, validate(changePassword), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

router.post('/forgot-password', validate(forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(resetPassword), authController.resetPassword);



module.exports = router;
