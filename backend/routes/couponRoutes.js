const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.userId || (typeof req.user === 'string' ? req.user : null);
};

// Helper: Get how many times a user has used this specific coupon
const getUserUsageCount = (user, codeUpper) => {
  if (!user) return 0;
  // If user has couponUsage map/array
  if (Array.isArray(user.couponUsageHistory)) {
    const found = user.couponUsageHistory.find((c) => String(c.code).toUpperCase() === codeUpper);
    if (found) return Number(found.count) || 0;
  }
  // Fallback to legacy string array usedCoupons
  if (Array.isArray(user.usedCoupons)) {
    return user.usedCoupons.filter((c) => String(c).toUpperCase() === codeUpper).length;
  }
  return 0;
};

// 🟢 1. GET /api/coupons/available (Lists all active coupons like SGS50, SGS100, SGS125)
router.get('/available', async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true }).sort({ baseValue: 1 }).lean();
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🟢 2. GET /api/coupons/my-coupons (Returns user's saved & usage count)
const handleGetCoupons = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      success: true,
      savedCoupons: user.savedCoupons || [],
      usedCoupons: user.usedCoupons || [],
      couponUsageHistory: user.couponUsageHistory || []
    });
  } catch (err) {
    console.error('Fetch saved coupons error:', err);
    return res.status(500).json({ message: 'Unable to fetch saved coupons' });
  }
};

// 🟢 3. POST /api/coupons/verify (Validates Base Value, Usage Limit & Max Discount)
router.post('/verify', protect, async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const userId = getUserId(req);
    const upperCode = String(code).trim().toUpperCase();
    const cartAmount = Number(cartTotal) || 0;

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Find coupon in Master DB or fallback to default sheet data
    let coupon = await Coupon.findOne({ code: upperCode, isActive: true }).lean();

    // Default Fallback matching your Excel Sheet if not yet in DB
    if (!coupon) {
      if (upperCode === 'SGS50') {
        coupon = { code: 'SGS50', noOfTimesUse: 'first_time', maxUsagePerUser: 1, baseValue: 500, discountType: 'lumpsum', lumpsumAmount: 50, maxDiscountValue: 50 };
      } else if (upperCode === 'SGS100') {
        coupon = { code: 'SGS100', noOfTimesUse: '10', maxUsagePerUser: 10, baseValue: 1500, discountType: 'percentage', percentageAmount: 5, maxDiscountValue: 100 };
      } else if (upperCode === 'SGS125') {
        coupon = { code: 'SGS125', noOfTimesUse: '2', maxUsagePerUser: 2, baseValue: 1000, discountType: 'percentage', percentageAmount: 10, maxDiscountValue: 75 };
      }
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    // 1️⃣ Check No. of times Use Limit
    const currentUsage = getUserUsageCount(user, upperCode);
    const maxAllowed = coupon.noOfTimesUse === 'first_time' ? 1 : Number(coupon.maxUsagePerUser || coupon.noOfTimesUse || 1);

    if (currentUsage >= maxAllowed) {
      return res.status(400).json({
        success: false,
        message: coupon.noOfTimesUse === 'first_time'
          ? `⚠️ Coupon "${upperCode}" is only valid for First Time Use.`
          : `⚠️ You have reached the maximum usage limit (${maxAllowed} times) for "${upperCode}".`
      });
    }

    // 2️⃣ Check Base Value (Minimum Order Amount)
    if (cartAmount < coupon.baseValue) {
      return res.status(400).json({
        success: false,
        message: `Min Order (Base Value) of ₹${coupon.baseValue} required to use "${upperCode}".`
      });
    }

    // 3️⃣ Calculate Discount (Lumpsum vs % with Max Discount Cap)
    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      const rawDisc = (cartAmount * (Number(coupon.percentageAmount) || 0)) / 100;
      // Cap by Max Discount Value
      calculatedDiscount = Math.min(rawDisc, Number(coupon.maxDiscountValue));
    } else {
      // Lumpsum flat discount
      const flat = Number(coupon.lumpsumAmount) || Number(coupon.maxDiscountValue) || 0;
      calculatedDiscount = Math.min(flat, Number(coupon.maxDiscountValue || flat));
    }

    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    return res.json({
      success: true,
      code: upperCode,
      discount: calculatedDiscount,
      maxDiscountValue: coupon.maxDiscountValue,
      timesUsed: currentUsage,
      timesRemaining: maxAllowed - currentUsage,
      message: `🎉 Coupon "${upperCode}" applied! ₹${calculatedDiscount} saved.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error verifying coupon: ' + err.message });
  }
});

// 🟢 4. POST /api/coupons/record-usage (Called when order is placed to increment usage count)
router.post('/record-usage', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const userId = getUserId(req);
    const upperCode = String(code).trim().toUpperCase();
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.usedCoupons)) user.usedCoupons = [];
    user.usedCoupons.push(upperCode);

    if (!Array.isArray(user.couponUsageHistory)) user.couponUsageHistory = [];
    const existingIndex = user.couponUsageHistory.findIndex((c) => String(c.code).toUpperCase() === upperCode);

    if (existingIndex > -1) {
      user.couponUsageHistory[existingIndex].count += 1;
    } else {
      user.couponUsageHistory.push({ code: upperCode, count: 1 });
    }

    await user.save();
    res.json({ success: true, message: `Usage recorded for ${upperCode}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🟢 5. SEED DEFAULT COUPONS (SGS50, SGS100, SGS125 directly as per Excel Sheet)
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

    res.json({ success: true, message: '✅ SGS50, SGS100, and SGS125 coupons seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Routes export
router.get('/', protect, handleGetCoupons);
router.get('/my-coupons', protect, handleGetCoupons);

module.exports = router;