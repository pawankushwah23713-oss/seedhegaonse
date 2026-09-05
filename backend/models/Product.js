const mongoose = require('mongoose');

// Variant Sub-schema (Weight, Price, Discounts, Available Qty, Stock Date)
const variantSchema = new mongoose.Schema(
  {
    weight: { type: String, trim: true, default: '' }, // e.g., "500g", "1kg"
    price: { type: Number, default: 0 },
    discountLumpsum: { type: Number, default: 0 }, // ₹ Flat discount
    discountPercent: { type: Number, default: 0 },  // % Discount
    quantityAvailable: { type: Number, default: 0 }, // If <= 0 -> Out of Stock
    stockAvailableDate: { type: Date, default: null } // Date on which stock is available
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
      enum: ['ladoo', 'peda', 'petha', 'halwa', 'barfi', 'special']
    },
    productRank: { type: Number, default: 0 },
    latestProduct: { type: Boolean, default: false }, // Yes / No
    skuNo: { type: String, trim: true, default: '' },
    originRegion: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // Attributes from Excel
    shelfLife: { type: String, default: '' }, // e.g., "30 Days"
    preservation: { type: String, default: '' }, // e.g., "Store in cool dry place"
    desiGhee: { type: String, default: '' }, // e.g., "100% Pure Desi Ghee"
    hygiene: { type: String, default: '' },

    // Tax & Compliance
    gstRate: { type: Number, default: 5 }, // GST %
    hsnCode: { type: String, default: '' },

    // Dynamic Variants
    variants: { type: [variantSchema], default: [] },

    // Fallback base pricing
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },

    // Multi-Image Array (Image 1, Image 2, Image 3)
    images: { type: [String], default: [] },
    image: { type: String, default: '' }, // Fallback for backward compatibility

    // Stock Management
    inStock: { type: Boolean, default: true },

    // Offers & Dynamic slabs
    discountPercent: { type: Number, default: 0 },
    discountValidUntil: { type: Date, default: null },
    couponsList: { type: [couponItemSchema], default: [] },
    quantityDiscounts: { type: [qtyDiscountSchema], default: [] },
    bulkTiers: { type: [bulkTierSchema], default: [] },
    giftTiers: { type: [giftTierSchema], default: [] },
    isFreeDelivery: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Pre-save hook: Automatically evaluate inStock if variants exist
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    const totalQty = this.variants.reduce((acc, curr) => acc + (Number(curr.quantityAvailable) || 0), 0);
    this.inStock = totalQty > 0;
  }
  next();
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;