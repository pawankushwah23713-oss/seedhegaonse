// models/StoreSetting.js
const mongoose = require('mongoose');

/**
 * 🟢 Poore store ki ek hi settings document rehti hai (singleton).
 * Isme gift box ka naam/price aur tax percent admin set karta hai,
 * aur cart wahi values use karta hai.
 */
const storeSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true
    },

    // 🎁 Gift Box Packaging
    giftBoxEnabled: { type: Boolean, default: true },
    giftBoxTitle: { type: String, trim: true, default: 'Gift Box Packaging' },
    giftBoxCharge: { type: Number, default: 50 },

    // 🧾 Tax (GST) percent
    productTaxPercent: { type: Number, default: 5 },
    shippingTaxPercent: { type: Number, default: 5 }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.StoreSetting || mongoose.model('StoreSetting', storeSettingSchema);