const { Partner } = require('../models');
const { generateToken } = require('../utils/jwt');

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

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  getProfile,
  changePassword,
};
