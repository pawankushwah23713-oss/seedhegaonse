const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    // 🟢 Sirf ye nayi field add hui hai coupons store karne ke liye
    savedCoupons: [
      {
        code: { type: String, uppercase: true, trim: true },
        discountType: { type: String, default: 'flat' },
        discountValue: { type: Number, default: 0 },
        minSpend: { type: Number, default: 0 },
        validUntil: { type: Date, default: null },
        productName: { type: String, default: '' },
        source: { type: String, default: 'manual' },
        savedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);