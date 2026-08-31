const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. CREATE ORDER (With Lifetime Coupon Lock)
router.post('/', async (req, res) => {
  try {
    const {
      customer,
      orderItems,
      totalAmount,
      paymentMethod,
      upiTransactionId,
      couponCode,
      couponDiscount,
      bulkDiscount,
      subTotal,
      shippingCharge,
      taxAmount
    } = req.body;

    if (!customer || !orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Cart items and customer details are required.' });
    }

    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded._id;
      } catch (err) {
        // Guest user
      }
    }

    const cleanCoupon = couponCode ? String(couponCode).trim().toUpperCase() : '';

    // 🔒 1. SERVER-SIDE CHECK: Kya user ne ye coupon pehle use kiya hai?
    if (userId && cleanCoupon) {
      const existingUser = await User.findById(userId);
      if (existingUser) {
        const alreadyUsed = (existingUser.usedCoupons || []).some(
          (c) => String(c).toUpperCase() === cleanCoupon
        );

        if (alreadyUsed) {
          return res.status(400).json({
            message: `⚠️ Coupon "${cleanCoupon}" has already been used once by this account.`
          });
        }

        // 🔒 2. ATOMIC LOCK: 'usedCoupons' me lock karo & 'savedCoupons' se delete karo
        await User.findByIdAndUpdate(userId, {
          $addToSet: { usedCoupons: cleanCoupon },
          $pull: { savedCoupons: { code: cleanCoupon } }
        });
      }
    }

    const isUpi = String(paymentMethod).toUpperCase() === 'UPI';
    if (isUpi && !upiTransactionId) {
      return res.status(400).json({ message: 'UPI transaction/reference ID is required.' });
    }

    const orderData = {
      customer,
      orderItems,
      totalAmount: Number(totalAmount),
      subTotal: Number(subTotal) || 0,
      couponDiscount: Number(couponDiscount) || 0,
      bulkDiscount: Number(bulkDiscount) || 0,
      shippingCharge: Number(shippingCharge) || 0,
      taxAmount: Number(taxAmount) || 0,
      couponCode: cleanCoupon,
      paymentMethod: isUpi ? 'UPI' : 'COD',
      paymentStatus: isUpi ? 'pending_verification' : 'pending',
      orderStatus: 'Placed',
      user: userId
    };

    if (isUpi) {
      orderData.upiTransactionId = upiTransactionId;
    }

    const newOrder = await Order.create(orderData);

    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', newOrder);
    }

    res.status(201).json({
      message: isUpi
        ? '🎉 Order placed! We will verify your UPI payment shortly.'
        : '🎉 Order placed successfully with Cash on Delivery!',
      orderId: newOrder._id,
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order: ' + error.message });
  }
});

// 2. GET USER MY ORDERS
router.get('/my-orders', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user orders: ' + error.message });
  }
});

// 3. GET ALL ORDERS (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders: ' + error.message });
  }
});

// 4. UPDATE ORDER STATUS (Admin Only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updatedOrder = await order.save();
    res.status(200).json({ message: 'Order status updated!', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Update failed: ' + error.message });
  }
});

module.exports = router;