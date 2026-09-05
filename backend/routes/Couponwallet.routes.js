const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

// Helper: Token ya body se User ID safely nikalna
const extractUserId = (req) => {
  if (req.user?._id || req.user?.id || req.userId) {
    return req.user._id || req.user.id || req.userId;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      return decoded?.id || decoded?._id || decoded?.userId || null;
    } catch {
      return null;
    }
  }
  return req.body?.userId || null;
};

// Helper: User ne ye specific coupon kitni baar use kiya hai check karna
const getUserCouponUsage = (user, codeUpper) => {
  if (!user) return 0;

  if (Array.isArray(user.couponUsageHistory)) {
    const found = user.couponUsageHistory.find(
      (c) => String(c.code).trim().toUpperCase() === codeUpper
    );
    if (found && typeof found.count === 'number') {
      return found.count;
    }
  }

  if (Array.isArray(user.usedCoupons)) {
    return user.usedCoupons.filter(
      (c) => String(c).trim().toUpperCase() === codeUpper
    ).length;
  }

  return 0;
};

// Helper: userId (ObjectId) / email / phone se user dhundo
const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;
  const trimmed = String(identifier).trim();

  if (trimmed.match(/^[0-9a-fA-F]{24}$/)) {
    const byId = await User.findById(trimmed);
    if (byId) return byId;
  }

  const byEmail = await User.findOne({ email: trimmed.toLowerCase() });
  if (byEmail) return byEmail;

  const byPhone = await User.findOne({ phone: trimmed });
  return byPhone;
};

// =========================================================
// ➕ 1. ADD / CREATE NEW COUPON (Admin Endpoint)
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
      isActive,
      assignedUser
    } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const upperCode = String(code).trim().toUpperCase();
    const finalUsage = noOfTimesUse || 'first_time';
    const finalMaxPerUser =
      finalUsage === 'first_time' ? 1 : Number(maxUsagePerUser || finalUsage) || 1;

    let assignedUserId = null;
    if (assignedUser) {
      const foundUser = await findUserByIdentifier(assignedUser);
      if (!foundUser) {
        return res.status(404).json({
          success: false,
          message: `Assigned user nahi mila ("${assignedUser}"). Sahi userId/email/phone check karein.`
        });
      }
      assignedUserId = foundUser._id;
    }

    const newCoupon = await Coupon.findOneAndUpdate(
      { code: upperCode },
      {
        code: upperCode,
        noOfTimesUse: finalUsage,
        maxUsagePerUser: finalMaxPerUser,
        baseValue: Number(baseValue) || 0,
        discountType: discountType || 'lumpsum',
        lumpsumAmount: Number(lumpsumAmount) || 0,
        percentageAmount: Number(percentageAmount) || 0,
        maxDiscountValue: Number(maxDiscountValue) || Number(lumpsumAmount) || 0,
        isActive: isActive !== undefined ? isActive : true,
        assignedUser: assignedUserId
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
router.post('/', handleAddCoupon);

// =========================================================
// 📋 2. GET ALL ACTIVE COUPONS
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
// ⚡ 3. SEED EXCEL SHEET COUPONS
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
// 🔍 4. VERIFY COUPON
// =========================================================
router.post('/verify', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code required' });
    }

    const upperCode = String(code).trim().toUpperCase();
    const cartAmount = Number(cartTotal) || 0;

    let coupon = await Coupon.findOne({ code: upperCode, isActive: true }).lean();

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

    const userId = extractUserId(req);

    if (coupon.assignedUser) {
      if (!userId || String(coupon.assignedUser) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: `⚠️ Coupon "${upperCode}" sirf ek specific user ke liye assign kiya gaya hai.`
        });
      }
    }

    const maxAllowed =
      coupon.noOfTimesUse === 'first_time'
        ? 1
        : Number(coupon.maxUsagePerUser || coupon.noOfTimesUse || 1);

    if (userId) {
      const user = await User.findById(userId).lean();
      if (user) {
        const timesUsed = getUserCouponUsage(user, upperCode);

        if (timesUsed >= maxAllowed) {
          return res.status(400).json({
            success: false,
            message:
              coupon.noOfTimesUse === 'first_time' || maxAllowed === 1
                ? `⚠️ Coupon "${upperCode}" sirf 1st Order use ke liye valid tha. Aap ise pehle use kar chuke hain.`
                : `⚠️ Aap "${upperCode}" coupon ki limit (${maxAllowed} baar) poori kar chuke hain.`
          });
        }
      }
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
      maxDiscountValue: coupon.maxDiscountValue,
      message: `🎉 Coupon "${upperCode}" applied! (₹${calculatedDiscount} OFF)`
    });
  } catch (err) {
    console.error('Verify coupon error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 📝 5. RECORD USAGE (+1)
// =========================================================
router.post('/record-usage', async (req, res) => {
  try {
    const { code, userId: bodyUserId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code required' });

    const upperCode = String(code).trim().toUpperCase();
    const userId = extractUserId(req) || bodyUserId;

    if (!userId) {
      return res.json({ success: true, message: 'Guest order recorded' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!Array.isArray(user.usedCoupons)) user.usedCoupons = [];
    user.usedCoupons.push(upperCode);

    if (!Array.isArray(user.couponUsageHistory)) user.couponUsageHistory = [];
    const existingIndex = user.couponUsageHistory.findIndex(
      (c) => String(c.code).trim().toUpperCase() === upperCode
    );

    if (existingIndex > -1) {
      user.couponUsageHistory[existingIndex].count =
        (Number(user.couponUsageHistory[existingIndex].count) || 0) + 1;
    } else {
      user.couponUsageHistory.push({ code: upperCode, count: 1 });
    }

    await user.save();

    return res.json({
      success: true,
      message: `Usage count updated for "${upperCode}"`
    });
  } catch (err) {
    console.error('Record usage error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 🗑️ 6. DELETE COUPON
// =========================================================
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Coupon.findByIdAndDelete(id);
    }

    if (!deleted) {
      deleted = await Coupon.findOneAndDelete({ code: String(id).trim().toUpperCase() });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    return res.json({ success: true, message: `🗑️ Coupon "${deleted.code}" delete ho gaya!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 👛 7. GET LOGGED-IN USER'S OWN WALLET BALANCE
// =========================================================
router.get('/my-wallet', async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login required to view wallet.' });
    }

    const user = await User.findById(userId).select('name email phone walletBalance walletHistory');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      walletBalance: Number(user.walletBalance) || 0,
      walletHistory: (user.walletHistory || []).slice().reverse()
    });
  } catch (err) {
    console.error('My wallet fetch error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 👛 8. 🟢 FIX: DEDUCT / DEBIT FROM LOGGED-IN USER'S WALLET (Order Checkout Call)
// =========================================================
router.post('/my-wallet/debit', async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Login required.' });
    }

    const debitAmount = Number(req.body.amount);
    const { orderId, note } = req.body;

    if (!debitAmount || debitAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid debit amount.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const currentBalance = Number(user.walletBalance) || 0;
    if (currentBalance < debitAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Current: ₹${currentBalance}, Requested: ₹${debitAmount}`
      });
    }

    // 🛑 Deduct from wallet balance in MongoDB
    user.walletBalance = Math.round((currentBalance - debitAmount) * 100) / 100;

    // Record in transaction history
    if (!Array.isArray(user.walletHistory)) user.walletHistory = [];
    user.walletHistory.push({
      amount: -debitAmount,
      note: note || `Used in order #${orderId || ''}`,
      addedBy: 'checkout',
      date: new Date()
    });

    await user.save();

    return res.json({
      success: true,
      message: `₹${debitAmount} deducted from wallet successfully!`,
      walletBalance: user.walletBalance
    });
  } catch (err) {
    console.error('Wallet debit error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 👛 9. ADD WALLET CREDIT TO A SPECIFIC USER (Admin Endpoint)
// =========================================================
router.post('/admin/wallet-credit', async (req, res) => {
  try {
    const { identifier, amount, note } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'User identifier (userId, email, ya phone) required hai.'
      });
    }

    const creditAmount = Number(amount);
    if (!creditAmount || creditAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount dijiye.' });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User nahi mila. Sahi userId, email ya phone check karein.'
      });
    }

    user.walletBalance = Number(user.walletBalance || 0) + creditAmount;

    if (!Array.isArray(user.walletHistory)) user.walletHistory = [];
    user.walletHistory.push({
      amount: creditAmount,
      note: note && note.trim() ? note.trim() : 'Admin wallet credit',
      addedBy: 'admin',
      date: new Date()
    });

    await user.save();

    return res.json({
      success: true,
      message: `✅ ₹${creditAmount} "${user.name || user.email || user.phone}" ke wallet me add ho gaye!`,
      wallet: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance
      }
    });
  } catch (err) {
    console.error('Wallet credit error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 👛 10. GET A USER'S WALLET BALANCE + HISTORY (Admin Endpoint)
// =========================================================
router.get('/admin/wallet/:identifier', async (req, res) => {
  try {
    const user = await findUserByIdentifier(req.params.identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila.' });
    }

    return res.json({
      success: true,
      wallet: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance || 0,
        walletHistory: user.walletHistory || []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;