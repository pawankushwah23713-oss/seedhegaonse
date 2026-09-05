const mongoose = require('mongoose');

// Variant Sub-schema (Weight, Price, Discounts, Available Qty, Stock Date)
const variantSchema = new mongoose.Schema(
  {
    weight: { type: String, trim: true, default: '' },
    price: { type: Number, default: 0 },
    discountLumpsum: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    quantityAvailable: { type: Number, default: 0 },
    stockAvailableDate: { type: Date, default: null }
  },
  { _id: false }
);

// Standard Promotion Schemas
const bulkTierSchema = new mongoose.Schema({
  minSpend: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  discountValue: { type: Number, default: 0 }
}, { _id: false });

const giftTierSchema = new mongoose.Schema({
  minSpend: { type: Number, default: 0 },
  giftTitle: { type: String, trim: true, default: '' },
  giftImage: { type: String, default: '' }
}, { _id: false });

const couponItemSchema = new mongoose.Schema({
  code: { type: String, uppercase: true, trim: true, default: '' },
  discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  discountValue: { type: Number, default: 0 },
  minSpend: { type: Number, default: 0 },
  validUntil: { type: Date, default: null }
}, { _id: false });

const qtyDiscountSchema = new mongoose.Schema({
  minQty: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      default: 'ladoo'
    },
    productRank: { type: Number, default: 1 },
    latestProduct: { type: Boolean, default: false },
    skuNo: { type: String, trim: true, default: '' },
    originRegion: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    shelfLife: { type: String, default: '' },
    preservation: { type: String, default: '' },
    desiGhee: { type: String, default: '' },
    hygiene: { type: String, default: '' },

    gstRate: { type: Number, default: 5 },
    hsnCode: { type: String, default: '' },

    variants: { type: [variantSchema], default: [] },
    price: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number, default: 0 },

    images: { type: [String], default: [] },
    image: { type: String, default: '' },

    inStock: { type: Boolean, default: true },

    discountPercent: { type: Number, default: 0 },
    discountValidUntil: { type: Date, default: null },
    couponsList: { type: [couponItemSchema], default: [] },
    quantityDiscounts: { type: [qtyDiscountSchema], default: [] },
    bulkTiers: { type: [bulkTierSchema], default: [] },
    giftTiers: { type: [giftTierSchema], default: [] },
    isFreeDelivery: { type: Boolean, default: false }
  },
  { timestamps: true, strict: false }
);

// 🟢 FIX: Modern Mongoose (v7/v8) compatible pre-save hook (NO next argument)
productSchema.pre('save', function () {
  if (this.variants && this.variants.length > 0) {
    const totalQty = this.variants.reduce((acc, curr) => acc + (Number(curr.quantityAvailable) || 0), 0);
    this.inStock = totalQty > 0;
  }
});

const Product = mongoose.models && mongoose.models.Product
  ? mongoose.models.Product
  : mongoose.model('Product', productSchema);

module.exports = Product;