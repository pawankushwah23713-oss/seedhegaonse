const mongoose = require('mongoose');

const policySectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true },
    // Supports **bold** markdown-style emphasis — rendered safely on frontend
    content: { type: String, required: true },
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const corporateBulkOrdersSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Corporate & Bulk Orders', trim: true },
    introText: { type: String, required: true },
    sections: { type: [policySectionSchema], default: [] },
    // Shown in italics at the bottom of the page
    footerNote: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Only ONE document should ever exist — routes enforce this (findOne / upsert)
module.exports = mongoose.model('CorporateBulkOrders', corporateBulkOrdersSchema);