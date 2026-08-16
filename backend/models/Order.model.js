// models/Order.model.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    img: { type: String }
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String, required: true },
    landmark: { type: String }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    customer: { type: customerSchema, required: true },
    orderItems: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'RAZORPAY'],
      default: 'COD'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'pending_verification', 'paid', 'failed'],
      default: 'pending'
    },

    // Manual UPI reference
    upiTransactionId: { type: String },

    // Razorpay fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // 🟢 FIXED: Capitalized + Lowercase dono allow kiye hain taaki koi validation error na aaye
    orderStatus: {
      type: String,
      enum: [
        'Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled',
        'placed', 'confirmed', 'dispatched', 'delivered', 'cancelled', 'processing', 'shipped'
      ],
      default: 'Placed'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);