const Order = require('../models/Order.model');

// 1. Customer Orders (Sorted by Latest First)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email;
    const userPhone = req.user?.phone;

    const query = {
      $or: [
        ...(userId ? [{ user: userId }] : []),
        ...(userEmail ? [{ 'customer.email': userEmail }] : []),
        ...(userPhone ? [{ 'customer.phone': userPhone }] : [])
      ]
    };

    const filter = query.$or.length > 0 ? query : { user: userId };
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch your orders: ' + err.message });
  }
};

// 2. Admin All Orders (Sorted by Latest First)
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
      user: req.user?._id || req.user?.id || undefined,
      customer,
      orderItems,
      totalAmount,
      paymentMethod: isUpi ? 'UPI' : (paymentMethod || 'COD'),
      paymentStatus: isUpi ? 'pending_verification' : 'pending',
      orderStatus: 'Placed',
      upiTransactionId: upiTransactionId || undefined,
      messages: []
    });

    // 🟢 Real-time Socket Event Emit with exact ISO Timestamp
    const io = req.app.get('io');
    if (io) {
      const orderPayload = order.toObject ? order.toObject() : order;
      if (!orderPayload.createdAt) {
        orderPayload.createdAt = new Date().toISOString();
      }
      io.emit('new_order', orderPayload);
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

// 🟢 6. ORDER LIVE CHAT (Admin & Customer ke messages save aur broadcast karna)
exports.sendOrderMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, sender, senderName } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text cannot be empty.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const newMessage = {
      sender: sender || (req.user?.role === 'admin' ? 'admin' : 'customer'),
      senderName: senderName || req.user?.name || (sender === 'admin' ? 'Admin / Support' : 'Customer'),
      text: text.trim(),
      createdAt: new Date()
    };

    order.messages.push(newMessage);
    await order.save();

    // 🟢 Real-time Socket Event Emit
    const io = req.app.get('io');
    if (io) {
      io.emit('order_chat_message', {
        orderId: id,
        message: order.messages[order.messages.length - 1]
      });
    }

    return res.status(200).json({
      message: 'Message sent successfully',
      chatMessage: order.messages[order.messages.length - 1]
    });
  } catch (err) {
    console.error('sendOrderMessage error:', err);
    return res.status(500).json({ message: 'Failed to send message: ' + err.message });
  }
};

// 7. Delete Order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Delete failed: ' + err.message });
  }
};