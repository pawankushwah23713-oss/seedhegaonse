const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const Product = require('../models/Product');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 🟢 Main Image + Offer Image dono accept karne ke liye middleware setup
const productUploads = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'offerImage', maxCount: 1 }
]);

// 1. GET ALL PRODUCTS (Public & Admin)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sweets: ' + error.message });
  }
});

// 2. ADD NEW PRODUCT WITH OFFERS (Admin Only)
router.post('/', protect, adminOnly, productUploads, async (req, res) => {
  try {
    const { name, originRegion, price, originalPrice, discount, offerText, category, description } = req.body;

    if (!req.files || !req.files['image']) {
      return res.status(400).json({ message: 'Please upload the main sweet product image.' });
    }

    const imagePath = `/uploads/products/${req.files['image'][0].filename}`;
    const offerImagePath = req.files['offerImage']
      ? `/uploads/products/${req.files['offerImage'][0].filename}`
      : '';

    const newProduct = await Product.create({
      name: name.trim(),
      originRegion: originRegion.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      discount: discount ? Number(discount) : 0,
      offerText: offerText ? offerText.trim() : '',
      offerImage: offerImagePath,
      category,
      description: description ? description.trim() : '',
      image: imagePath
    });

    res.status(201).json({
      message: '🎉 Sweet added successfully with offer details!',
      product: newProduct
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. EDIT / UPDATE PRODUCT & OFFERS (Admin Only)
router.put('/:id', protect, adminOnly, productUploads, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, originRegion, price, originalPrice, discount, offerText, category, description, inStock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Sweet product not found!' });
    }

    // 🟢 1. Agar nayi Main Image upload hui ho
    if (req.files && req.files['image']) {
      if (product.image) {
        const oldImagePath = path.join(__dirname, '..', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = `/uploads/products/${req.files['image'][0].filename}`;
    }

    // 🟢 2. Agar nayi Offer Image upload hui ho
    if (req.files && req.files['offerImage']) {
      if (product.offerImage) {
        const oldOfferPath = path.join(__dirname, '..', product.offerImage);
        if (fs.existsSync(oldOfferPath)) {
          fs.unlinkSync(oldOfferPath);
        }
      }
      product.offerImage = `/uploads/products/${req.files['offerImage'][0].filename}`;
    }

    // Update remaining fields
    if (name) product.name = name.trim();
    if (originRegion) product.originRegion = originRegion.trim();
    if (price) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice) || 0;
    if (discount !== undefined) product.discount = Number(discount) || 0;
    if (offerText !== undefined) product.offerText = offerText.trim();
    if (category) product.category = category;
    if (description !== undefined) product.description = description.trim();
    if (inStock !== undefined) product.inStock = inStock === 'true' || inStock === true;

    const updatedProduct = await product.save();

    res.status(200).json({
      message: '🎉 Sweet updated successfully!',
      product: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ message: 'Update failed: ' + error.message });
  }
});

// 4. DELETE PRODUCT (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found!' });
    }

    // Main Image delete karo
    if (product.image) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Offer Image delete karo
    if (product.offerImage) {
      const offerPath = path.join(__dirname, '..', product.offerImage);
      if (fs.existsSync(offerPath)) {
        fs.unlinkSync(offerPath);
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: '🗑️ Sweet deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed: ' + error.message });
  }
});

module.exports = router;