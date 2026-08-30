// models/DeliveryPincode.js
const mongoose = require('mongoose');

const deliveryPincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    // 🟢 City ab save hogi (pehle schema me thi hi nahi, isliye drop ho rahi thi)
    city: {
      type: String,
      trim: true,
      default: ''
    },
    deliveryCharge: {
      type: Number,
      required: true
    },
    isServiceable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DeliveryPincode ||
  mongoose.model('DeliveryPincode', deliveryPincodeSchema);