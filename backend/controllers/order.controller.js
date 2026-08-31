const jwt = require('jsonwebtoken');
const Order = require('../models/Order.model');
const User = require('../models/User.model') || require('../models/User');

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

// 3. Create Order (With Lifetime Coupon Lock, Complete Price Breakdown & Socket Emit)
exports.createOrder = async (req, res) => {
  try {
    const {
      customer,
      shippingAddress,
      billingAddress,
      deliveryZone,
      shippingType,
      orderItems,
      totalAmount,
      paymentMethod,
      upiTransactionId,
      couponCode,
      couponDiscount,
      bulkDiscount,
      subTotal,
      shippingCharge,
      taxAmount,
      productTax,
      shippingTax,
      giftBoxCharge,
      giftBoxTitle
    } = req.body;

    if (!customer || !orderItems || !orderItems.length || totalAmount === undefined) {
      return res.status(400).json({ message: 'Missing required order fields (customer, items, total).' });
    }

    // 🔑 Extract User ID (via middleware or direct token header)
    let userId = req.user?._id || req.user?.id || null;
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded._id;
      } catch {
        // Guest user
      }
    }

    const cleanCoupon = couponCode ? String(couponCode).trim().toUpperCase() : '';

    // 🔒 1. SINGLE-USE COUPON VERIFICATION & ATOMIC LOCK
    if (userId && cleanCoupon) {
      try {
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

          // Lock in 'usedCoupons' & remove from 'savedCoupons'
          await User.findByIdAndUpdate(userId, {
            $addToSet: { usedCoupons: cleanCoupon },
            $pull: { savedCoupons: { code: cleanCoupon } }
          });
        }
      } catch (userErr) {
        console.error('Coupon check error:', userErr);
      }
    }

    const isUpi = String(paymentMethod).toUpperCase() === 'UPI';
    if (isUpi && !upiTransactionId) {
      return res.status(400).json({ message: 'UPI transaction / reference ID is required.' });
    }

    // 📦 Create Order Record with full cart data
    const orderData = {
      user: userId || undefined,
      customer: customer || shippingAddress,
      shippingAddress: shippingAddress || customer,
      billingAddress: billingAddress || shippingAddress || customer,
      deliveryZone: deliveryZone || '',
      shippingType: shippingType || 'delivery',
      orderItems,
      subTotal: Number(subTotal) || 0,
      bulkDiscount: Number(bulkDiscount) || 0,
      couponDiscount: Number(couponDiscount) || 0,
      couponCode: cleanCoupon,
      shippingCharge: Number(shippingCharge) || 0,
      taxAmount: Number(taxAmount) || 0,
      productTax: Number(productTax) || 0,
      shippingTax: Number(shippingTax) || 0,
      giftBoxCharge: Number(giftBoxCharge) || 0,
      giftBoxTitle: giftBoxTitle || '',
      totalAmount: Number(totalAmount),
      paymentMethod: isUpi ? 'UPI' : (paymentMethod || 'COD'),
      paymentStatus: isUpi ? 'pending_verification' : 'pending',
      orderStatus: 'Placed',
      upiTransactionId: upiTransactionId || undefined,
      messages: []
    };

    const order = await Order.create(orderData);

    // 🟢 Real-time Socket Event Emit
    const io = req.app.get('io');
    if (io) {
      const orderPayload = order.toObject ? order.toObject() : order;
      if (!orderPayload.createdAt) {
        orderPayload.createdAt = new Date().toISOString();
      }
      io.emit('new_order', orderPayload);
      io.emit('newOrder', orderPayload);
    }

    return res.status(201).json({
      success: true,
      message: isUpi
        ? '🎉 Order placed! We will verify your UPI payment shortly.'
        : '🎉 Order placed successfully!',
      orderId: order._id.toString(),
      order
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ message: 'Could not place order: ' + err.message });
  }
};

// 4. Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// 5. Update Order & Payment Status
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

// 6. ORDER LIVE CHAT (Admin & Customer messages save & socket emit)
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

    order.messages = order.messages || [];
    order.messages.push(newMessage);
    await order.save();

    // 🟢 Real-time Socket Emit
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