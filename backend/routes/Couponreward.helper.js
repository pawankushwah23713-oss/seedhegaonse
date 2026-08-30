/**
 * =====================================================================
 * COUPON REWARD HELPER — grant a coupon after an order completes
 * =====================================================================
 * Import this ONE function into your existing orders backend route,
 * and call it right after an order is successfully created, to
 * automatically drop a reward coupon into the customer's saved-coupon
 * wallet.
 *
 * 🔁 REPLACE the `User` import below with your actual Mongoose User model.
 *
 * USAGE (inside your existing orders route, e.g. routes/orders.js):
 *
 *   const { grantPostOrderCoupon } = require('./helpers/couponReward.helper');
 *   ...
 *   const newOrder = await Order.create(orderPayload);   // your existing code
 *
 *   await grantPostOrderCoupon(req.userId, {
 *     code: 'THANKYOU10',
 *     discountType: 'percentage',
 *     discountValue: 10,
 *     minSpend: 0,
 *     validUntil: null,               // or a Date, e.g. 30 days from now
 *     productName: 'Reward for your last order'
 *   });
 *
 * This never runs on its own — you decide exactly when/what coupon to
 * grant by calling it from your own order-success code.
 * =====================================================================
 */

// 🔁 REPLACE with your actual Mongoose User model import
const User = require('../models/User');

async function grantPostOrderCoupon(userId, coupon) {
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const upperCode = String(coupon.code).trim().toUpperCase();
    user.savedCoupons = user.savedCoupons || [];

    const alreadySaved = user.savedCoupons.some((c) => c.code === upperCode);
    if (alreadySaved) return { success: true, message: 'Already granted' };

    user.savedCoupons.push({
      code: upperCode,
      discountType: coupon.discountType || 'flat',
      discountValue: Number(coupon.discountValue) || 0,
      minSpend: Number(coupon.minSpend) || 0,
      validUntil: coupon.validUntil || null,
      productName: coupon.productName || '',
      source: 'order-reward',
      savedAt: new Date()
    });

    await user.save();
    return { success: true, message: `${upperCode} granted` };
  } catch (err) {
    console.error('grantPostOrderCoupon error:', err);
    return { success: false, message: 'Failed to grant coupon' };
  }
}

module.exports = { grantPostOrderCoupon };