const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Like = require('../models/Like');
const { verifyToken } = require('../middleware/authMiddleware');

// 🟢 1. GET Wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const rawUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!rawUserId) {
      return res.status(401).json({ message: 'User unauthorized. Invalid token.' });
    }

    const userId = new mongoose.Types.ObjectId(rawUserId);

    let userLikes = await Like.findOne({ user: userId }).populate('products');

    if (!userLikes || !userLikes.products) {
      return res.json([]);
    }

    // Filter out null/deleted products
    const activeProducts = userLikes.products.filter(Boolean);
    return res.json(activeProducts);
  } catch (err) {
    console.error('Wishlist GET Error:', err);
    return res.status(500).json({ message: 'Server error fetching wishlist', error: err.message });
  }
});

// 🟢 2. TOGGLE Wishlist (Add / Remove)
router.post('/toggle/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const rawUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!rawUserId) {
      return res.status(401).json({ message: 'User unauthorized. Token missing.' });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      return res.status(400).json({ message: 'Invalid User ID or Product ID format' });
    }

    const userId = new mongoose.Types.ObjectId(rawUserId);
    const prodIdObj = new mongoose.Types.ObjectId(productId);

    // Find or Create Wishlist Document
    let userLikes = await Like.findOne({ user: userId });

    if (!userLikes) {
      userLikes = new Like({
        user: userId,
        products: []
      });
    }

    if (!Array.isArray(userLikes.products)) {
      userLikes.products = [];
    }

    // Check if already in wishlist
    const existsIndex = userLikes.products.findIndex(
      (p) => p && p.toString() === productId.toString()
    );

    let action = '';
    if (existsIndex > -1) {
      // Remove product
      userLikes.products.splice(existsIndex, 1);
      action = 'removed';
    } else {
      // Add product
      userLikes.products.push(prodIdObj);
      action = 'added';
    }

    await userLikes.save();

    return res.status(200).json({
      success: true,
      action,
      wishlist: userLikes.products
    });
  } catch (err) {
    console.error('❌ Wishlist Toggle Server Error:', err);
    return res.status(500).json({ message: 'Server error toggling wishlist', error: err.message });
  }
});

module.exports = router;