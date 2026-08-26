const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. PUBLIC: Validate / Apply Coupon
router.post('/verify', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code.' });
    }

    const now = new Date();
    if (now < new Date(coupon.validFrom)) {
      return res.status(400).json({ message: 'This coupon offer has not started yet.' });
    }

    if (now > new Date(coupon.validUntil)) {
      return res.status(400).json({ message: 'Coupon expired! Please try another code.' });
    }

    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Min. order of ₹${coupon.minOrderValue} required for this coupon.`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((cartTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0 && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      message: `Coupon ${coupon.code} applied! ₹${discount} OFF`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. ADMIN: List all coupons
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. ADMIN: Create new coupon
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);
    res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. ADMIN: Delete coupon
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;