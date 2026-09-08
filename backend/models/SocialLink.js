// models/SocialLink.js
const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema(
  {
    // 'platform' picks which built-in icon renders on the frontend.
    // Use 'custom' if the platform isn't in the built-in list — in that
    // case set customLabel so the admin/frontend can still identify it.
    platform: {
      type: String,
      enum: [
        'instagram',
        'facebook',
        'pinterest',
        'youtube',
        'twitter',
        'whatsapp',
        'linkedin',
        'custom'
      ],
      required: true
    },
    customLabel: { type: String, default: '' }, // only used when platform === 'custom'
    url: { type: String, required: true },
    order: { type: Number, default: 0 }, // lower shows first
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialLink', socialLinkSchema);