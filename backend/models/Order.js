// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. CREATE ORDER — handles COD and manual UPI (Razorpay uses payment.routes.js instead)
router.post('/', async (req, res) => {
  try {
    const { customer, orderItems, totalAmount, paymentMethod, upiTransactionId } = req.body;

    if (!customer || !orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Cart items and customer details are required.' });
    }

    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Guest user, continue without userId
      }
    }

    // Decide payment fields based on what the frontend sent
    const isUpi = paymentMethod === 'UPI';

    if (isUpi && !upiTransactionId) {
      return res.status(400).json({ message: 'UPI transaction/reference ID is required.' });
    }

    const orderData = {
      customer,
      orderItems,
      totalAmount: Number(totalAmount),
      paymentMethod: isUpi ? 'UPI' : 'COD',
      paymentStatus: isUpi ? 'pending_verification' : 'pending',
      orderStatus: 'placed',
      user: userId
    };

    if (isUpi) {
      orderData.upiTransactionId = upiTransactionId;
    }

    const newOrder = await Order.create(orderData);

    // 🟢 Real-time push to admin panel (same as before)
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

// 2. GET ALL ORDERS (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders: ' + error.message });
  }
});

// 3. UPDATE ORDER STATUS (Admin Only)
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