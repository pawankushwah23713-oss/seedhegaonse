// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const Product = require('../models/Product');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. GET ALL PRODUCTS (Public & Admin)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sweets: ' + error.message });
  }
});

// 2. ADD PRODUCT (Admin Only)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, originRegion, price, category, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a product image.' });
    }

    const imagePath = `/uploads/products/${req.file.filename}`;

    const newProduct = await Product.create({
      name: name.trim(),
      originRegion: originRegion.trim(),
      price: Number(price),
      category,
      description: description ? description.trim() : '',
      image: imagePath
    });

    res.status(201).json({ message: 'Sweet added successfully!', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. EDIT / UPDATE PRODUCT (Admin Only)
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, originRegion, price, category, description, inStock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Sweet product not found!' });
    }

    // Agar nayi image upload hui hai
    if (req.file) {
      // Purani image server storage se delete karo
      if (product.image) {
        const oldImagePath = path.join(__dirname, '..', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = `/uploads/products/${req.file.filename}`;
    }

    // Update other fields
    if (name) product.name = name.trim();
    if (originRegion) product.originRegion = originRegion.trim();
    if (price) product.price = Number(price);
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

    // Image file ko storage se delete karo
    if (product.image) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: '🗑️ Sweet deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed: ' + error.message });
  }
});

module.exports = router;