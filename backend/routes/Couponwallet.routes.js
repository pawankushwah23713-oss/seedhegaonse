const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.userId || (typeof req.user === 'string' ? req.user : null);
};

// 🟢 GET /api/coupons/my-coupons
const handleGetCoupons = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      success: true,
      savedCoupons: Array.isArray(user.savedCoupons) ? user.savedCoupons : [],
      usedCoupons: Array.isArray(user.usedCoupons) ? user.usedCoupons : []
    });
  } catch (err) {
    console.error('Fetch saved coupons error:', err);
    return res.status(500).json({ message: 'Unable to fetch saved coupons' });
  }
};

// 🟢 POST /api/coupons/my-coupons (Sirf 1 baar save hoga, already used coupon dubara save nahi hoga)
const handleSaveCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minSpend, validUntil, productName, source } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const upperCode = String(code).trim().toUpperCase();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const saved = Array.isArray(user.savedCoupons) ? user.savedCoupons : [];
    const used = Array.isArray(user.usedCoupons) ? user.usedCoupons : [];

    // ❌ STRICT CHECK: Agar pehle se saved hai YA pehle use kar chuka hai toh block karein
    if (used.includes(upperCode)) {
      return res.json({ success: false, message: 'You have already used this coupon once.', savedCoupons: saved });
    }
    if (saved.some((c) => c && c.code === upperCode)) {
      return res.json({ success: true, message: 'Already in wallet', savedCoupons: saved });
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

    user.savedCoupons.push(newCouponItem);
    await user.save();

    return res.json({
      success: true,
      message: `${upperCode} saved successfully!`,
      savedCoupons: user.savedCoupons
    });
  } catch (err) {
    console.error('Save coupon error:', err);
    return res.status(500).json({ message: 'Unable to save coupon', error: err.message });
  }
};

// 🟢 DELETE /api/coupons/my-coupons/:code (Order place hote hi usedCoupons me permanently daal dega)
const handleDeleteCoupon = async (req, res) => {
  try {
    const upperCode = String(req.params.code || '').trim().toUpperCase();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Wallet se nikalein
    user.savedCoupons = (user.savedCoupons || []).filter((c) => c.code !== upperCode);

    // 2. Permanently 'usedCoupons' history me add karein (Lifetime 1 Time restriction ke liye)
    if (!Array.isArray(user.usedCoupons)) user.usedCoupons = [];
    if (!user.usedCoupons.includes(upperCode)) {
      user.usedCoupons.push(upperCode);
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Coupon consumed and marked as used',
      savedCoupons: user.savedCoupons,
      usedCoupons: user.usedCoupons
    });
  } catch (err) {
    console.error('Remove coupon error:', err);
    return res.status(500).json({ message: 'Unable to remove coupon' });
  }
};

// Route support
router.get('/', protect, handleGetCoupons);
router.get('/my-coupons', protect, handleGetCoupons);
router.post('/', protect, handleSaveCoupon);
router.post('/my-coupons', protect, handleSaveCoupon);
router.delete('/:code', protect, handleDeleteCoupon);
router.delete('/my-coupons/:code', protect, handleDeleteCoupon);

module.exports = router;