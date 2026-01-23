const crypto = require('crypto');
const { Partner } = require('../models');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');

const register = async (data) => {
  const { email } = data;
  const existingPartner = await Partner.findOne({ where: { email } });
  
  if (existingPartner) {
    if (existingPartner.isVerified) {
       throw new Error('Email already exists');
    }
    // If exists but not verified, we can resend OTP or update details. 
    // For simplicity, let's update details and resend OTP.
    await existingPartner.destroy();
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const partner = await Partner.create({ ...data, otp, otpExpires });
  
  // Send OTP email
  await require('../utils/email').sendOTP(partner.email, otp);

  // Do NOT return token yet. User must verify OTP first.
  return { message: 'Registration successful. Please verify OTP sent to your email.' };
};

const verifyOtp = async (email, otp) => {
  const partner = await Partner.findOne({ where: { email } });

  if (!partner) {
    throw new Error('User not found');
  }

  if (partner.isVerified) {
    throw new Error('User already verified');
  }

  if (partner.status === 'blocked') {
    throw new Error('Your account has been blocked. Please contact admin.');
  }

  if (partner.otp !== otp) {
    throw new Error('Invalid OTP');
  }

  if (partner.otpExpires < new Date()) {
    throw new Error('OTP expired');
  }

  // OTP Valid
  partner.isVerified = true;
  partner.otp = null;
  partner.otpExpires = null;
  await partner.save();

  const token = generateToken({ id: partner.id, email: partner.email });
  return { partner, token };
};

const resendOtp = async (email) => {
  const partner = await Partner.findOne({ where: { email } });

  if (!partner) {
    throw new Error('User not found');
  }

  if (partner.isVerified) {
    throw new Error('User already verified');
  }

  // Generate new 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  partner.otp = otp;
  partner.otpExpires = otpExpires;
  await partner.save();

  // Send OTP email
  await require('../utils/email').sendOTP(partner.email, otp);

  return { message: 'OTP sent successfully' };
};

const login = async (email, password) => {
  const partner = await Partner.findOne({ where: { email } });
  
  if (!partner) {
    throw new Error('Invalid email or password');
  }

  if (!partner.isVerified) {
    throw new Error('Account not verified. Please verify OTP.');
  }

  if (partner.status === 'blocked') {
    throw new Error('Your account has been blocked. Please contact admin.');
  }

  const isMatch = await partner.validatePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({ id: partner.id, email: partner.email });
  return { partner, token };
};

const getProfile = async (id) => {
  const partner = await Partner.findByPk(id);
  if (!partner) {
    throw new Error('Partner not found');
  }
  return partner;
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const partner = await Partner.findByPk(userId);
  if (!partner) {
    throw new Error('User not found');
  }

  const isMatch = await partner.validatePassword(oldPassword);
  if (!isMatch) {
    throw new Error('Incorrect old password');
  }

  partner.password = newPassword;
  await partner.save(); // Hook will hash it

  return { message: 'Password updated successfully' };
};

const forgotPassword = async (email) => {
  const partner = await Partner.findOne({ where: { email } });

  if (!partner) {
    throw new Error('User not found');
  }

  if (partner.status === 'blocked') {
    throw new Error('Your account has been blocked. Please contact admin.');
  }

  // Create reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  partner.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  partner.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await partner.save();

  // Create reset url
  // Note: In production, this should be the frontend URL
  const resetUrl = `https://crmportal.unzolo.com/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail(partner.email, resetUrl);
    return { message: 'Email sent' };
  } catch (err) {
    partner.resetPasswordToken = null;
    partner.resetPasswordExpire = null;
    await partner.save();
    throw new Error('Email could not be sent');
  }
};

const resetPassword = async (resetToken, newPassword) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const partner = await Partner.findOne({
    where: {
      resetPasswordToken,
      resetPasswordExpire: {
        [require('sequelize').Op.gt]: Date.now(),
      },
    },
  });

  if (!partner) {
    throw new Error('Invalid or expired token');
  }

  // Set new password
  partner.password = newPassword;
  partner.resetPasswordToken = null;
  partner.resetPasswordExpire = null;
  await partner.save();

  return { message: 'Password reset successful' };
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
