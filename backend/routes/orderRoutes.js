// routes/order.routes.js
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  sendOrderMessage // 🟢 Added
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. Create order
router.post('/', createOrder);

// 2. Customer Orders
router.get('/my-orders', protect, getMyOrders);

// 3. Admin All Orders
router.get('/', protect, adminOnly, getAllOrders || getMyOrders);

// 4. Update status (Admin)
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

// 🟢 5. Send Chat Message (Customer & Admin dono use kar sakte hain)
router.post('/:id/messages', protect, sendOrderMessage);

// 6. Delete order (Admin)
router.delete('/:id', protect, adminOnly, deleteOrder);

// 7. Get single order by ID
router.get('/:id', getOrderById);

module.exports = router;