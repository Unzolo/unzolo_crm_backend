const nodemailer = require('nodemailer');
const config = require('../config/env');

// Create transporter
// NOTE: For real email sending, you need valid SMTP credentials in .env
// For development, we can use Ethereal or just log the OTP if checking console.
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use 'smtp.ethereal.email' etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
  };

  try {
    // if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    //     console.log(`[DEV MODE] Email to ${to}, OTP: ${otp}`);
    //     return true;
    // }
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendOTP,
};
