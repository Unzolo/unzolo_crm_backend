const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env');
const { Partner } = require('../models');

// Helper to get Razorpay instance safely
const getRazorpayInstance = () => {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new Error('Razorpay API keys are missing in the server configuration (.env)');
  }
  return new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
};

exports.createOrder = async (req, res) => {
  try {
    const options = {
      amount: 300 * 100, // ₹300 in paise
      currency: "INR",
      receipt: `sub_${req.user.id.substring(0, 8)}_${Date.now()}`,
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);
    res.status(201).json({ 
        success: true,
        data: order 
    });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ success: false, message: "Failed to create payment order", error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
       // Payment verified successfully
       const partner = await Partner.findByPk(req.user.id);
       
       const now = new Date();
       // If trial hasn't ended (before March 1), start from March 1
       const trialEnd = new Date("2026-03-01");
       
       let baseDate = partner.subscriptionExpires ? new Date(partner.subscriptionExpires) : now;
       
       // Fallback for trial period: if buying during trial, start from trial end OR now, whichever is later
       if (baseDate < trialEnd) baseDate = trialEnd;
       if (baseDate < now) baseDate = now;
       
       const newExpiry = new Date(baseDate);
       newExpiry.setMonth(newExpiry.getMonth() + 1);

       await partner.update({
         plan: 'pro',
         subscriptionExpires: newExpiry,
         isWhatsappEnabled: true
       });

       res.status(200).json({ 
           success: true, 
           message: "Payment verified! Your subscription is now active.",
           data: {
               plan: 'pro',
               subscriptionExpires: newExpiry
           }
       });
    } else {
       res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    res.status(500).json({ success: false, message: "Verification failed", error: error.message });
  }
};
