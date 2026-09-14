const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    // 💵 Cash on Delivery (Admin Toggle)
    codEnabled: {
      type: Boolean,
      default: true // true = COD चालू, false = COD बंद
    },

    // 📲 Online / UPI Settings (Admin Toggle)
    upiEnabled: {
      type: Boolean,
      default: true // true = UPI चालू, false = UPI बंद
    },
    upiId: {
      type: String,
      default: 'seedhegaonse@upi',
      trim: true
    },

    // 🎁 Gift Box Packaging
    giftBoxEnabled: {
      type: Boolean,
      default: true
    },
    giftBoxTitle: {
      type: String,
      default: 'Gift Box Packaging'
    },
    giftBoxCharge: {
      type: Number,
      default: 50
    },

    // 📊 GST / Tax Percentage
    productTaxPercent: {
      type: Number,
      default: 5
    },
    shippingTaxPercent: {
      type: Number,
      default: 5
    },

    // 🎟️ Coupons aur Gift Slabs
    productGlobalCoupons: {
      type: Array,
      default: []
    },
    productGlobalGiftTiers: {
      type: Array,
      default: []
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);