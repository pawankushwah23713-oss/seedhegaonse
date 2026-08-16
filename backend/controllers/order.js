// controllers/order.controller.js
const Order = require('../models/Order.model');

// POST /api/orders  -> used for COD and manual-UPI orders
exports.createOrder = async (req, res) => {
  try {
    const { customer, orderItems, totalAmount, paymentMethod, upiTransactionId } = req.body;

    if (!customer || !orderItems || !orderItems.length || !totalAmount) {
      return res.status(400).json({ message: 'Missing required order fields.' });
    }

    const isUpi = paymentMethod === 'UPI';

    if (isUpi && !upiTransactionId) {
      return res.status(400).json({ message: 'UPI transaction reference is required.' });
    }

    const order = await Order.create({
      user: req.user?.id || undefined,
      customer,
      orderItems,
      totalAmount,
      paymentMethod: isUpi ? 'UPI' : 'COD',
      paymentStatus: isUpi ? 'pending_verification' : 'pending',
      orderStatus: 'placed',
      upiTransactionId: upiTransactionId || undefined
    });

    // 🟢 Real-time push to admin panel
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', order);
    }

    return res.status(201).json({
      message: isUpi
        ? '🎉 Order placed! We will verify your UPI payment shortly.'
        : '🎉 Order placed successfully with Cash on Delivery!',
      orderId: order._id.toString(),
      order
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ message: 'Server error, could not place order: ' + err.message });
  }
};

// GET /api/orders/:id  -> fetch a single order
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json(order);
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/orders  -> list all orders (admin) or user's own orders
exports.getMyOrders = async (req, res) => {
  try {
    const filter = req.user?.id ? { user: req.user.id } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/orders/:id/status -> update order/payment status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updatedOrder = await order.save();
    return res.status(200).json({ message: 'Order status updated!', order: updatedOrder });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ message: 'Update failed: ' + err.message });
  }
};