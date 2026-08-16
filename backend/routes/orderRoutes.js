// routes/order.routes.js
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders, // Admin ke liye
  updateOrderStatus,
  deleteOrder
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. Create order (Customer)
router.post('/', createOrder);

// 🟢 2. CUSTOMER ORDERS (MyOrders.jsx yahi call karta hai) - Must be before /:id
router.get('/my-orders', protect, getMyOrders);

// 3. ADMIN ALL ORDERS (Admin Panel ke liye)
router.get('/', protect, adminOnly, getAllOrders || getMyOrders);

// 4. Update status (Admin)
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

// 5. Delete order (Admin)
router.delete('/:id', protect, adminOnly, deleteOrder);

// 6. Get single order by ID (Hamesha aakhiri me hona chahiye)
router.get('/:id', getOrderById);

module.exports = router;