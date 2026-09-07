// models/ReturnRefundPolicy.js
const mongoose = require('mongoose');

const returnRefundPolicySchema = new mongoose.Schema(
  {
    pageTitle: {
      type: String,
      trim: true,
      default: 'Return & Refund Policy'
    },
    introText: {
      type: String,
      trim: true,
      default: ''
    },
    // Each string in this array becomes one bullet point on the public page,
    // in the exact order the admin arranged them.
    policyPoints: {
      type: [String],
      default: []
    },
    footerText: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.ReturnRefundPolicy || mongoose.model('ReturnRefundPolicy', returnRefundPolicySchema);