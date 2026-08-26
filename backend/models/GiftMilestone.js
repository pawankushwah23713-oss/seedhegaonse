const mongoose = require('mongoose');

const giftMilestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    minOrder: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    orderIndex: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GiftMilestone', giftMilestoneSchema);