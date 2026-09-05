const mongoose = require('mongoose');

const deliveryPincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    deliveryCharge: {
      type: Number,
      required: true
    },
    gstPercent: {
      type: Number,
      required: true,
      default: 18 // Default 18 rahega agar kuch na diya ho
    },
    isServiceable: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    strict: false // ✅ Isse 5% ya koi bhi custom GST kabhi strip nahi hoga
  }
);

module.exports =
  mongoose.models.DeliveryPincode ||
  mongoose.model('DeliveryPincode', deliveryPincodeSchema);