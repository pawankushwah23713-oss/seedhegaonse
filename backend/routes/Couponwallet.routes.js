const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Helper function to extract user ID safely
const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.userId || (typeof req.user === 'string' ? req.user : null);
};

// 🟢 GET /api/coupons/my-coupons (Handles both '/' and '/my-coupons')
const handleGetCoupons = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      success: true,
      savedCoupons: Array.isArray(user.savedCoupons) ? user.savedCoupons : []
    });
  } catch (err) {
    console.error('Fetch saved coupons error:', err);
    return res.status(500).json({ message: 'Unable to fetch saved coupons' });
  }
};

// 🟢 POST /api/coupons/my-coupons (Save coupon to MongoDB directly)
const handleSaveCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minSpend, validUntil, productName, source } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const upperCode = String(code).trim().toUpperCase();

    // 1. Check if user exists
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingCoupons = Array.isArray(user.savedCoupons) ? user.savedCoupons : [];
    const alreadySaved = existingCoupons.some((c) => c && c.code === upperCode);

    if (alreadySaved) {
      return res.json({ success: true, message: 'Already saved', savedCoupons: existingCoupons });
    }

    const newCouponItem = {
      code: upperCode,
      discountType: discountType || 'flat',
      discountValue: Number(discountValue) || 0,
      minSpend: Number(minSpend) || 0,
      validUntil: validUntil ? new Date(validUntil) : null,
      productName: productName || '',
      source: source || 'order-reward',
      savedAt: new Date()
    };

    // 2. Direct MongoDB atomic update (Bypasses all mongoose validation errors)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { savedCoupons: newCouponItem } },
      { new: true, runValidators: false }
    ).lean();

    return res.json({
      success: true,
      message: `${upperCode} saved successfully to MongoDB!`,
      savedCoupons: updatedUser?.savedCoupons || []
    });
  } catch (err) {
    console.error('Save coupon to MongoDB error:', err);
    return res.status(500).json({ message: 'Unable to save coupon', error: err.message });
  }
};

// 🟢 DELETE /api/coupons/my-coupons/:code (Remove coupon from MongoDB)
const handleDeleteCoupon = async (req, res) => {
  try {
    const upperCode = String(req.params.code || '').trim().toUpperCase();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedCoupons: { code: upperCode } } },
      { new: true, runValidators: false }
    ).lean();

    return res.json({
      success: true,
      message: 'Coupon removed',
      savedCoupons: updatedUser?.savedCoupons || []
    });
  } catch (err) {
    console.error('Remove coupon error:', err);
    return res.status(500).json({ message: 'Unable to remove coupon' });
  }
};

// Route support for BOTH mounting styles:
router.get('/', protect, handleGetCoupons);
router.get('/my-coupons', protect, handleGetCoupons);

router.post('/', protect, handleSaveCoupon);
router.post('/my-coupons', protect, handleSaveCoupon);

router.delete('/:code', protect, handleDeleteCoupon);
router.delete('/my-coupons/:code', protect, handleDeleteCoupon);

module.exports = router;