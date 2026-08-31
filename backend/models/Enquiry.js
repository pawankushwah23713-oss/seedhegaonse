const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    sweets: {
      type: String,
      trim: true,
      default: 'Not Specified',
    },
    quantity: {
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
    },
    eventType: {
      type: String,
      trim: true,
      default: 'General Order',
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Contacted', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enquiry', enquirySchema);