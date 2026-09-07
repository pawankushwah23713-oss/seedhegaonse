// models/ReturnRefundPolicy.js
const mongoose = require('mongoose');

// ⚠️ No hardcoded policy text anywhere in this schema — every field starts
// empty. All real content is entered by the admin through the admin page.
const returnRefundPolicySchema = new mongoose.Schema(
  {
    pageTitle: { type: String, default: '' },
    introText: { type: String, default: '' },

    // Each string becomes one bullet point (<li>) on the public page, in order.
    policyPoints: { type: [String], default: [] },

    footerText: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReturnRefundPolicy', returnRefundPolicySchema);