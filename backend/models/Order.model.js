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

// 🟢 Chat Message Schema
const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['admin', 'customer'], required: true },
    senderName: { type: String, default: '' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
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

    upiTransactionId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    orderStatus: {
      type: String,
      enum: [
        'Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled',
        'placed', 'confirmed', 'dispatched', 'delivered', 'cancelled', 'processing', 'shipped'
      ],
      default: 'Placed'
    },

    // 🟢 Chat Messages history per order
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  { timestamps: true } // 🟢 Auto manages createdAt and updatedAt
);

module.exports = mongoose.model('Order', orderSchema);