const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    // 'first_time' ya number jaise 1, 2, 10
    noOfTimesUse: {
      type: String,
      default: 'first_time' // 'first_time', '1', '2', '10', etc.
    },
    maxUsagePerUser: {
      type: Number,
      default: 1 // 1 for first_time, 10, 2 etc.
    },
    baseValue: {
      type: Number,
      required: true,
      default: 0 // Min cart value (e.g. 500, 1500, 1000)
    },
    discountType: {
      type: String,
      enum: ['lumpsum', 'percentage'],
      required: true,
      default: 'lumpsum'
    },
    lumpsumAmount: {
      type: Number,
      default: 0 // e.g. 50
    },
    percentageAmount: {
      type: Number,
      default: 0 // e.g. 5, 10
    },
    maxDiscountValue: {
      type: Number,
      required: true,
      default: 0 // e.g. 50, 100, 75
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);