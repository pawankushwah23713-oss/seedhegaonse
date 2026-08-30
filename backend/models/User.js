const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    savedCoupons: {
      type: Array,
      default: []
    }
  },
  { timestamps: true, strict: false } // strict: false ensure karega ki data har haal me save ho
);

module.exports = mongoose.model('User', userSchema);