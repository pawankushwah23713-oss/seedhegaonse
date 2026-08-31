const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  sendOrderMessage
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ==========================================
// 1. STATIC & SPECIFIC ROUTES (Upar aayenge)
// ==========================================

// Create new order (Public / Authenticated)
router.post('/', createOrder);

// Customer: Get logged-in user's past orders
router.get('/my-orders', protect, getMyOrders);

// Admin: Get all orders across the store
router.get('/', protect, adminOnly, getAllOrders);


// ==========================================
// 2. PARAMETERIZED ROUTES (/:id - Hamesha Niche)
// ==========================================

// Customer/Admin: Send chat/order messages
router.post('/:id/messages', protect, sendOrderMessage);

// Admin: Update order & payment status
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

// Admin: Delete order
router.delete('/:id', protect, adminOnly, deleteOrder);

// Get single order details by MongoDB _id / orderId
router.get('/:id', getOrderById);

module.exports = router;