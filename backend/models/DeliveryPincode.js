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
      default: 18 // Excel sheet ke hisaab se
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