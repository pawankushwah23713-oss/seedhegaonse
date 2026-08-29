const mongoose = require('mongoose');

// 1. Bulk Spend Sub-schema
const bulkTierSchema = new mongoose.Schema(
  {
    minSpend: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    discountValue: { type: Number, default: 0 }
  },
  { _id: false }
);

// 2. Free Gift Sub-schema
const giftTierSchema = new mongoose.Schema(
  {
    minSpend: { type: Number, default: 0 },
    giftTitle: { type: String, trim: true, default: '' },
    giftImage: { type: String, default: '' }
  },
  { _id: false }
);

// 3. Coupon Sub-schema
const couponItemSchema = new mongoose.Schema(
  {
    code: { type: String, uppercase: true, trim: true, default: '' },
    discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    discountValue: { type: Number, default: 0 },
    minSpend: { type: Number, default: 0 },
    validUntil: { type: Date, default: null }
  },
  { _id: false }
);

// 4. Quantity / Pack Discount Sub-schema
const qtyDiscountSchema = new mongoose.Schema(
  {
    minQty: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 }
  },
  { _id: false }
);

const cakeSchema = new mongoose.Schema(
  {
    // Basic Details
    name: { type: String, required: true, trim: true },
    originRegion: { type: String, default: 'Fresh Bakehouse', trim: true },
    category: {
      type: String,
      required: true,
      enum: ['chocolate', 'redvelvet', 'fruit', 'cheesecake', 'bento', 'butterscotch', 'special']
    },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    inStock: { type: Boolean, default: true },

    // Base Pricing & MRP
    price: { type: Number, required: true, min: 1 },
    originalPrice: { type: Number, default: 0 },

    // ⏳ 1. Time-Based Discount
    discountPercent: { type: Number, default: 0 },
    discountValidUntil: { type: Date, default: null },

    // 🎟️ 2. Dynamic Multiple Coupons (+ Add Multiple)
    couponsList: { type: [couponItemSchema], default: [] },

    // 📦 3. Dynamic Quantity / Pack Discounts (+ Add Multiple)
    quantityDiscounts: { type: [qtyDiscountSchema], default: [] },

    // 💎 4. Dynamic Multiple Bulk Slabs (+ Add Multiple Tiers)
    bulkTiers: { type: [bulkTierSchema], default: [] },

    // 🎁 5. Dynamic Multiple Free Gifts (+ Add Multiple Gifts)
    giftTiers: { type: [giftTierSchema], default: [] },

    // 🚚 6. Free Delivery Override
    isFreeDelivery: { type: Boolean, default: false },

    // Single-field Backward Compatibility
    productCouponCode: { type: String, uppercase: true, trim: true, default: '' },
    productCouponDiscount: { type: Number, default: 0 },
    productCouponType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    productCouponValidUntil: { type: Date, default: null },
    highValueThreshold: { type: Number, default: 0 },
    highValueDiscountPercent: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// 🟢 Fail-safe export
const Cake = mongoose.models.Cake || mongoose.model('Cake', cakeSchema);
module.exports = Cake;