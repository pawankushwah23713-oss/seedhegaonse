// controllers/order.controller.js

const Order = require('../models/Order.model');

// 🟢 1. Customer ke apne orders lana (MyOrders.jsx ke liye)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email;
    const userPhone = req.user?.phone;

    // Filter: User ID se match kare ya Customer ke email/phone se
    const query = {
      $or: [
        ...(userId ? [{ user: userId }] : []),
        ...(userEmail ? [{ 'customer.email': userEmail }] : []),
        ...(userPhone ? [{ 'customer.phone': userPhone }] : [])
      ]
    };

    // Agar query khali hai (fallback)
    const filter = query.$or.length > 0 ? query : { user: userId };

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch your orders: ' + err.message });
  }
};

// 🟢 2. Admin ke liye saare customer orders lana (AdminOrders.jsx ke liye)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    console.error('getAllOrders error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// 3. Create Order
exports.createOrder = async (req, res) => {
  try {
    const { customer, orderItems, totalAmount, paymentMethod, upiTransactionId } = req.body;

    if (!customer || !orderItems || !orderItems.length || !totalAmount) {
      return res.status(400).json({ message: 'Missing required order fields.' });
    }

    const isUpi = paymentMethod === 'UPI';

    const order = await Order.create({
      user: req.user?._id || req.user?.id || undefined, // Logged in user link ho jayega
      customer,
      orderItems,
      totalAmount,
      paymentMethod: isUpi ? 'UPI' : (paymentMethod || 'COD'),
      paymentStatus: isUpi ? 'pending_verification' : 'pending',
      orderStatus: 'Placed',
      upiTransactionId: upiTransactionId || undefined
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', order);
    }

    return res.status(201).json({
      message: '🎉 Order placed successfully!',
      orderId: order._id.toString(),
      order
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ message: 'Could not place order: ' + err.message });
  }
};

// 4. Get single order
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// 5. Update Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updatedOrder = await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_updated', updatedOrder);
    }

    return res.status(200).json({ message: 'Order updated!', order: updatedOrder });
  } catch (err) {
    return res.status(500).json({ message: 'Update failed: ' + err.message });
  }
};

// 6. Delete Order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Delete failed: ' + err.message });
  }
};