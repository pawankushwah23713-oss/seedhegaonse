const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.userId || (typeof req.user === 'string' ? req.user : null);
};

// 🟢 1. GET /api/coupons/my-coupons (Returns active saved coupons & used coupons list)
const handleGetCoupons = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const usedList = Array.isArray(user.usedCoupons)
      ? user.usedCoupons.map((u) => String(u).trim().toUpperCase())
      : [];
    const usedSet = new Set(usedList);

    // Active coupons list me se used coupons filter out
    const activeSaved = (Array.isArray(user.savedCoupons) ? user.savedCoupons : []).filter(
      (c) => c && c.code && !usedSet.has(String(c.code).trim().toUpperCase())
    );

    return res.json({
      success: true,
      savedCoupons: activeSaved,
      usedCoupons: usedList
    });
  } catch (err) {
    console.error('Fetch saved coupons error:', err);
    return res.status(500).json({ message: 'Unable to fetch saved coupons' });
  }
};

// 🟢 2. POST /api/coupons/verify (Validates single-use lifetime restriction)
router.post('/verify', protect, async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const userId = getUserId(req);
    const upperCode = String(code).trim().toUpperCase();

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const usedCoupons = Array.isArray(user.usedCoupons)
      ? user.usedCoupons.map((u) => String(u).toUpperCase())
      : [];

    // ❌ STRICT BLOCK: Agar pehle kabhi use kiya hai toh reject
    if (usedCoupons.includes(upperCode)) {
      return res.status(400).json({
        success: false,
        message: `⚠️ Coupon "${upperCode}" has already been used once by this account.`
      });
    }

    const savedCoupon = (user.savedCoupons || []).find(
      (c) => String(c.code).toUpperCase() === upperCode
    );

    if (savedCoupon) {
      const minSpend = Number(savedCoupon.minSpend) || 0;
      if (Number(cartTotal) < minSpend) {
        return res.status(400).json({
          success: false,
          message: `Minimum spend of ₹${minSpend} required for this coupon.`
        });
      }
      const disc = savedCoupon.discountType === 'percentage'
        ? (Number(cartTotal) * Number(savedCoupon.discountValue)) / 100
        : Number(savedCoupon.discountValue);

      return res.json({
        success: true,
        code: upperCode,
        discount: disc,
        message: 'Coupon applied successfully!'
      });
    }

    return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error verifying coupon: ' + err.message });
  }
});

// 🟢 3. POST /api/coupons/my-coupons (Save new coupon - blocks already used)
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
    const used = Array.isArray(user.usedCoupons)
      ? user.usedCoupons.map((u) => String(u).toUpperCase())
      : [];

    // ❌ STRICT BLOCK: If ever used, do not re-add
    if (used.includes(upperCode)) {
      return res.json({ success: false, message: 'Coupon already used once.', savedCoupons: saved });
    }

    if (saved.some((c) => String(c.code).toUpperCase() === upperCode)) {
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

// 🟢 4. DELETE /api/coupons/my-coupons/:code (Removes from wallet & adds to usedCoupons)
const handleDeleteCoupon = async (req, res) => {
  try {
    const upperCode = String(req.params.code || '').trim().toUpperCase();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedCoupons = (user.savedCoupons || []).filter(
      (c) => String(c.code).toUpperCase() !== upperCode
    );

    if (!Array.isArray(user.usedCoupons)) user.usedCoupons = [];
    if (!user.usedCoupons.includes(upperCode)) {
      user.usedCoupons.push(upperCode);
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Coupon removed and locked as used',
      savedCoupons: user.savedCoupons,
      usedCoupons: user.usedCoupons
    });
  } catch (err) {
    console.error('Remove coupon error:', err);
    return res.status(500).json({ message: 'Unable to remove coupon' });
  }
};

// Routes
router.get('/', protect, handleGetCoupons);
router.get('/my-coupons', protect, handleGetCoupons);
router.post('/', protect, handleSaveCoupon);
router.post('/my-coupons', protect, handleSaveCoupon);
router.delete('/:code', protect, handleDeleteCoupon);
router.delete('/my-coupons/:code', protect, handleDeleteCoupon);

module.exports = router;