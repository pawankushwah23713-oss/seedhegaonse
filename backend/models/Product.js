const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Basic Details
    name: { type: String, required: true, trim: true },
    originRegion: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['ladoo', 'peda', 'petha', 'halwa', 'barfi', 'special']
    },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    inStock: { type: Boolean, default: true },

    // Pricing
    price: { type: Number, required: true, min: 1 }, // Selling Base Price
    originalPrice: { type: Number, default: 0 },     // MRP

    // ⏳ 1. Time-Based Discount (Limited Days Offer)
    discountPercent: { type: Number, default: 0 },
    discountValidUntil: { type: Date, default: null }, // Date jis tak discount chalega

    // 🎟️ 2. Product-Specific Coupon Code
    productCouponCode: { type: String, uppercase: true, trim: true, default: '' },
    productCouponDiscount: { type: Number, default: 0 }, // Value (% ya Flat ₹)
    productCouponType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    productCouponValidUntil: { type: Date, default: null },

    // 💰 3. High-Value / Bulk Order Rule (Jaise ₹12,000+ spend par)
    highValueThreshold: { type: Number, default: 0 }, // Min amount (e.g. 12000)
    highValueDiscountPercent: { type: Number, default: 0 }, // Extra discount %

    // 🚚 4. Free Delivery Override for this product
    isFreeDelivery: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);