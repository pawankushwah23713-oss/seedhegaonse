// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/payment.controller');

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

module.exports = router;