// models/DeliveryPincode.js
const mongoose = require('mongoose');

const deliveryPincodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  deliveryCharge: {
    type: Number,
    required: true
  },
  isServiceable: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('DeliveryPincode', deliveryPincodeSchema);