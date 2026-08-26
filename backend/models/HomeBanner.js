const mongoose = require('mongoose');

const homeBannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    badgeText: { type: String, default: 'Special Offer' },
    linkUrl: { type: String, default: '/shop' },
    bannerImage: { type: String, required: true },
    flashSaleEndTime: { type: Date, default: null }, // Flash Sale Countdown
    isActive: { type: Boolean, default: true },
    orderIndex: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeBanner', homeBannerSchema);