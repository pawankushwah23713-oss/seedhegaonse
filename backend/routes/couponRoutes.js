const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.userId || (typeof req.user === 'string' ? req.user : null);
};

// =========================================================
// ➕ 1. ADD / CREATE NEW COUPON (Admin Endpoint - Fixed 404)
// Dono routes par sunega: POST /api/coupons aur POST /api/coupons/admin/add
// =========================================================
const handleAddCoupon = async (req, res) => {
  try {
    const {
      code,
      noOfTimesUse,
      maxUsagePerUser,
      baseValue,
      discountType,
      lumpsumAmount,
      percentageAmount,
      maxDiscountValue,
      isActive
    } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const upperCode = String(code).trim().toUpperCase();

    const newCoupon = await Coupon.findOneAndUpdate(
      { code: upperCode },
      {
        code: upperCode,
        noOfTimesUse: noOfTimesUse || 'first_time',
        maxUsagePerUser: noOfTimesUse === 'first_time' ? 1 : Number(maxUsagePerUser || noOfTimesUse) || 1,
        baseValue: Number(baseValue) || 0,
        discountType: discountType || 'lumpsum',
        lumpsumAmount: Number(lumpsumAmount) || 0,
        percentageAmount: Number(percentageAmount) || 0,
        maxDiscountValue: Number(maxDiscountValue) || Number(lumpsumAmount) || 0,
        isActive: isActive !== undefined ? isActive : true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: `✅ Coupon "${upperCode}" successfully add/update ho gaya!`,
      coupon: newCoupon
    });
  } catch (err) {
    console.error('Error adding coupon:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

router.post('/admin/add', handleAddCoupon);
router.post('/add', handleAddCoupon);
router.post('/', handleAddCoupon); // POST /api/coupons

// =========================================================
// 📋 2. GET ALL ACTIVE COUPONS (For Cart & Admin)
// =========================================================
router.get('/available', async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true }).sort({ baseValue: 1 }).lean();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// ⚡ 3. SEED EXCEL SHEET COUPONS (SGS50, SGS100, SGS125)
// =========================================================
router.post('/seed-excel-coupons', async (req, res) => {
  try {
    const sheetCoupons = [
      {
        code: 'SGS50',
        noOfTimesUse: 'first_time',
        maxUsagePerUser: 1,
        baseValue: 500,
        discountType: 'lumpsum',
        lumpsumAmount: 50,
        percentageAmount: 0,
        maxDiscountValue: 50,
        isActive: true
      },
      {
        code: 'SGS100',
        noOfTimesUse: '10',
        maxUsagePerUser: 10,
        baseValue: 1500,
        discountType: 'percentage',
        lumpsumAmount: 0,
        percentageAmount: 5,
        maxDiscountValue: 100,
        isActive: true
      },
      {
        code: 'SGS125',
        noOfTimesUse: '2',
        maxUsagePerUser: 2,
        baseValue: 1000,
        discountType: 'percentage',
        lumpsumAmount: 0,
        percentageAmount: 10,
        maxDiscountValue: 75,
        isActive: true
      }
    ];

    for (const c of sheetCoupons) {
      await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
    }

    return res.json({
      success: true,
      message: '✅ SGS50, SGS100, and SGS125 coupons seeded successfully!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 🔍 4. VERIFY COUPON (Base Value, Max Discount, Usage Limit)
// =========================================================
router.post('/verify', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const upperCode = String(code).trim().toUpperCase();
    const cartAmount = Number(cartTotal) || 0;

    let coupon = await Coupon.findOne({ code: upperCode, isActive: true }).lean();

    // Sheet Fallback agar DB me na ho
    if (!coupon) {
      if (upperCode === 'SGS50') {
        coupon = { code: 'SGS50', baseValue: 500, discountType: 'lumpsum', lumpsumAmount: 50, maxDiscountValue: 50 };
      } else if (upperCode === 'SGS100') {
        coupon = { code: 'SGS100', baseValue: 1500, discountType: 'percentage', percentageAmount: 5, maxDiscountValue: 100 };
      } else if (upperCode === 'SGS125') {
        coupon = { code: 'SGS125', baseValue: 1000, discountType: 'percentage', percentageAmount: 10, maxDiscountValue: 75 };
      }
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    if (cartAmount < (coupon.baseValue || 0)) {
      return res.status(400).json({
        success: false,
        message: `Min Order (Base Value) of ₹${coupon.baseValue} required for ${upperCode}.`
      });
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      const raw = (cartAmount * (Number(coupon.percentageAmount) || 0)) / 100;
      calculatedDiscount = Math.min(raw, Number(coupon.maxDiscountValue) || raw);
    } else {
      const flat = Number(coupon.lumpsumAmount) || Number(coupon.maxDiscountValue) || 0;
      calculatedDiscount = Math.min(flat, Number(coupon.maxDiscountValue) || flat);
    }

    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    return res.json({
      success: true,
      code: upperCode,
      discount: calculatedDiscount,
      message: `🎉 Coupon "${upperCode}" applied! (₹${calculatedDiscount} OFF)`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 🗑️ 5. DELETE COUPON
// =========================================================
router.delete('/admin/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;