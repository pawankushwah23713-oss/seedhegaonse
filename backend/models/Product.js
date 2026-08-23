const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sweet name is required'],
      trim: true
    },
    originRegion: {
      type: String,
      required: [true, 'Origin region/village is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be greater than 0']
    },
    // 🟢 Offer & Chhoot Fields
    originalPrice: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number, // Chhoot (% me)
      default: 0
    },
    offerText: {
      type: String,
      trim: true,
      default: ''
    },
    offerImage: {
      type: String, // Offer banner / sticker image path
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['ladoo', 'peda', 'petha', 'halwa', 'barfi', 'special']
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Product main image is required']
    },
    inStock: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);