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

    // 🟢 Saved Address (added so the cart's checkout address can be
    // persisted to the user's profile and edited later from Profile Info)
    address: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    addressType: { type: String, trim: true, default: 'Permanent' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },

    savedCoupons: {
      type: Array,
      default: []
    }
  },
  { timestamps: true, strict: false } // strict: false ensure karega ki data har haal me save ho
);

module.exports = mongoose.model('User', userSchema);