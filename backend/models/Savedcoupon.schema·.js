/**
 * =====================================================================
 * USER MODEL ADDITION — savedCoupons field
 * =====================================================================
 * This is NOT a full model file — it's the piece you need to ADD into
 * your EXISTING User Mongoose schema (wherever that file lives in your
 * backend, e.g. models/User.js).
 *
 * HOW TO USE:
 * Open your existing User schema file and add `savedCoupons` as a new
 * field on the schema, exactly like below.
 * =====================================================================
 */

// Example of a standalone sub-schema for one saved coupon entry.
// You can inline this directly into your User schema instead of
// importing it separately — whichever fits your existing file style.

const mongoose = require('mongoose');

const SavedCouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    discountValue: { type: Number, default: 0 },
    minSpend: { type: Number, default: 0 },
    validUntil: { type: Date, default: null },
    productName: { type: String, default: '' },
    source: { type: String, enum: ['manual', 'order-reward'], default: 'manual' },
    savedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

module.exports = SavedCouponSchema;

/**
 * =====================================================================
 * WHERE TO ADD IT IN YOUR EXISTING User SCHEMA
 * =====================================================================
 *
 *   const SavedCouponSchema = require('./SavedCoupon.schema'); // this file
 *
 *   const userSchema = new mongoose.Schema({
 *     name: String,
 *     email: String,
 *     phone: String,
 *     // ...all your existing fields stay exactly as they are...
 *
 *     savedCoupons: {
 *       type: [SavedCouponSchema],
 *       default: []
 *     }
 *   });
 *
 * That's it — no other change needed to your User model.
 * =====================================================================
 */