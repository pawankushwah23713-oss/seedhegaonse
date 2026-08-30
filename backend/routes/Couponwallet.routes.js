const express = require('express');
const router = express.Router();

// 🟢 Object destructuring se 'protect' middleware import karein
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET /api/coupons/my-coupons  → fetch the logged-in user's saved coupon wallet
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId).select('savedCoupons');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true, savedCoupons: user.savedCoupons || [] });
  } catch (err) {
    console.error('Fetch saved coupons error:', err);
    return res.status(500).json({ message: 'Unable to fetch saved coupons' });
  }
});

// POST /api/coupons/my-coupons  → "Get" a coupon, save it to the user's wallet
router.post('/', protect, async (req, res) => {
  try {
    const { code, discountType, discountValue, minSpend, validUntil, productName } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const upperCode = String(code).trim().toUpperCase();
    const alreadySaved = (user.savedCoupons || []).some((c) => c.code === upperCode);
    if (alreadySaved) {
      return res.json({ success: true, message: 'Already saved', savedCoupons: user.savedCoupons });
    }

    user.savedCoupons = user.savedCoupons || [];
    user.savedCoupons.push({
      code: upperCode,
      discountType: discountType || 'flat',
      discountValue: Number(discountValue) || 0,
      minSpend: Number(minSpend) || 0,
      validUntil: validUntil || null,
      productName: productName || '',
      source: 'manual',
      savedAt: new Date()
    });
    await user.save();

    return res.json({ success: true, message: `${upperCode} saved to your profile`, savedCoupons: user.savedCoupons });
  } catch (err) {
    console.error('Save coupon error:', err);
    return res.status(500).json({ message: 'Unable to save coupon' });
  }
});

// DELETE /api/coupons/my-coupons/:code  → remove a saved coupon from the wallet
router.delete('/:code', protect, async (req, res) => {
  try {
    const upperCode = String(req.params.code || '').trim().toUpperCase();
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedCoupons = (user.savedCoupons || []).filter((c) => c.code !== upperCode);
    await user.save();

    return res.json({ success: true, savedCoupons: user.savedCoupons });
  } catch (err) {
    console.error('Remove saved coupon error:', err);
    return res.status(500).json({ message: 'Unable to remove coupon' });
  }
});

module.exports = router;