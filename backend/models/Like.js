const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  // Kis user ki wishlist hai
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Us user ke liked products
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Like', likeSchema);