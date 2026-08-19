const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Like = require('../models/Like');
const { verifyToken } = require('../middleware/authMiddleware');

// 🟢 1. GET Wishlist (Populated with Product Details for Wishlist Page)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User unauthorized. Invalid token.' });
    }

    // 🟢 .populate('products') se Name, Price, Image sab data milega
    const userLikes = await Like.findOne({ user: userId }).populate('products');

    if (!userLikes || !userLikes.products) {
      return res.json([]);
    }

    // Filter out deleted/null products if any
    const activeProducts = userLikes.products.filter(item => item !== null);

    res.json(activeProducts);
  } catch (err) {
    console.error('Wishlist Fetch Error:', err);
    res.status(500).json({ message: 'Server error while fetching wishlist' });
  }
});

// 🟢 2. TOGGLE Product in Wishlist (Add / Remove)
router.post('/toggle/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User unauthorized. Invalid token.' });
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid Product ID' });
    }

    // User ki wishlist find karein ya nayi banayein
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

    // Check karein product pehle se array me hai ya nahi
    const index = userLikes.products.findIndex(
      (id) => id && id.toString() === productId.toString()
    );

    let action = '';

    if (index > -1) {
      // Pehle se tha -> Remove karein
      userLikes.products.splice(index, 1);
      action = 'removed';
    } else {
      // Nahi tha -> Add karein
      userLikes.products.push(productId);
      action = 'added';
    }

    await userLikes.save();

    res.json({
      success: true,
      action,
      wishlist: userLikes.products
    });
  } catch (err) {
    console.error('Wishlist Toggle Error:', err);
    res.status(500).json({ message: 'Server error while updating wishlist' });
  }
});

module.exports = router;