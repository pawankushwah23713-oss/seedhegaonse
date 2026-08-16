// controllers/payment.controller.js
const crypto = require('crypto');
const razorpayInstance = require('../config/razorpay');
const Order = require('../models/Order.model');

// POST /api/payment/create-order
// Body: { amount: Number }  (amount in rupees)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid amount.' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    return res.status(200).json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('createRazorpayOrder error:', err);
    return res.status(500).json({ message: 'Could not create payment order.' });
  }
};

// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer, orderItems, totalAmount }
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      orderItems,
      totalAmount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields.' });
    }
    if (!customer || !orderItems || !orderItems.length || !totalAmount) {
      return res.status(400).json({ message: 'Missing order details.' });
    }

    // Recreate the signature and compare
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Signature mismatch.' });
    }

    // Signature valid -> create the confirmed order in our DB
    const order = await Order.create({
      user: req.user?.id || undefined,
      customer,
      orderItems,
      totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });

    return res.status(201).json({
      message: 'Payment verified and order placed successfully.',
      orderId: order._id.toString()
    });
  } catch (err) {
    console.error('verifyRazorpayPayment error:', err);
    return res.status(500).json({ message: 'Server error during payment verification.' });
  }
};