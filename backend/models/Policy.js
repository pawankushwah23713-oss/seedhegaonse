// models/Policy.js
const mongoose = require('mongoose');

// 🟢 Generic reusable schema for any policy-style page
// (Shipping Policy, Privacy Policy, Terms & Conditions, Refund Policy, etc.)
const policySchema = new mongoose.Schema(
  {
    // Unique key identifying which policy this is, e.g. 'shipping', 'privacy', 'terms', 'refund'
    type: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Page heading, e.g. "Shipping Policy"
    title: {
      type: String,
      required: true,
      trim: true
    },

    // Intro paragraph shown right under the title (optional)
    intro: {
      type: String,
      default: ''
    },

    // Ordered list of sections that make up the policy body
    sections: {
      type: [
        {
          heading: { type: String, default: '' }, // e.g. "Delivery coverage & timelines"
          // Content supports basic inline HTML (e.g. <strong>...</strong>) since
          // only admins edit this — it is NOT user-submitted content.
          content: { type: String, required: true },
          order: { type: Number, default: 0 }
        }
      ],
      default: []
    },

    // Small note shown at the bottom of the page (optional)
    footerNote: {
      type: String,
      default: ''
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Policy || mongoose.model('Policy', policySchema);