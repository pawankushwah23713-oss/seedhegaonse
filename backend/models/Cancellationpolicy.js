const mongoose = require('mongoose');

// Each numbered block on the policy page (heading + paragraph)
const policySectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true },
    // Supports **bold** markdown-style emphasis — rendered safely on frontend
    content: { type: String, required: true },
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const cancellationPolicySchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Cancellation Policy', trim: true },
    introText: { type: String, required: true },
    sections: { type: [policySectionSchema], default: [] },
    footerNote: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Only ONE policy document should ever exist — routes enforce this (findOne / upsert)
module.exports = mongoose.model('CancellationPolicy', cancellationPolicySchema);