const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },

    // Saved Address
    address: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    addressType: { type: String, trim: true, default: 'Permanent' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },

    // 🟢 Active Wallet Coupons
    savedCoupons: {
      type: [
        {
          code: { type: String, uppercase: true, trim: true },
          discountType: { type: String, default: 'flat' },
          discountValue: { type: Number, default: 0 },
          minSpend: { type: Number, default: 0 },
          validUntil: { type: Date, default: null },
          productName: { type: String, default: '' },
          source: { type: String, default: 'order-reward' },
          savedAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },

    // 🔒 Lifetime Used Coupons (1 User = 1 Time Record)
    usedCoupons: {
      type: [String],
      default: []
    },

    // 👛 🟢 NEW: Wallet Balance — admin isme seedha paisa credit kar sakta hai,
    // jo user checkout par bina kisi coupon code ke use kar sakta hai.
    walletBalance: {
      type: Number,
      default: 0
    },

    // 👛 🟢 NEW: Wallet Balance history — har credit/debit ka record
    walletHistory: {
      type: [
        {
          amount: { type: Number, default: 0 },
          note: { type: String, default: '' },
          addedBy: { type: String, default: 'admin' },
          date: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);