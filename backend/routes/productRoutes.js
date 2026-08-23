// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const Product = require('../models/Product');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Multer upload wrapper taaki error JSON me catch ho
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'offerImage', maxCount: 1 }
]);

const handleProductUploads = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload Error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// 1. GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sweets: ' + error.message });
  }
});

// 2. ADD NEW PRODUCT (Admin Only)
router.post('/', protect, adminOnly, handleProductUploads, async (req, res) => {
  try {
    const { name, originRegion, price, originalPrice, discount, offerText, category, description } = req.body;

    if (!name || !originRegion || !price || !category) {
      return res.status(400).json({ message: 'Please provide all required fields (name, originRegion, price, category).' });
    }

    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      return res.status(400).json({ message: 'Please upload the main sweet product image.' });
    }

    const imagePath = `/uploads/products/${req.files['image'][0].filename}`;
    const offerImagePath = req.files['offerImage'] && req.files['offerImage'].length > 0
      ? `/uploads/products/${req.files['offerImage'][0].filename}`
      : '';

    const newProduct = await Product.create({
      name: (name || '').trim(),
      originRegion: (originRegion || '').trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      discount: discount ? Number(discount) : 0,
      offerText: (offerText || '').trim(),
      offerImage: offerImagePath,
      category,
      description: (description || '').trim(),
      image: imagePath
    });

    res.status(201).json({
      message: '🎉 Sweet added successfully with offer details!',
      product: newProduct
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ message: error.message || 'Server error creating product' });
  }
});

// 3. EDIT / UPDATE PRODUCT
router.put('/:id', protect, adminOnly, handleProductUploads, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, originRegion, price, originalPrice, discount, offerText, category, description, inStock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Sweet product not found!' });
    }

    // New Main Image
    if (req.files && req.files['image']) {
      if (product.image) {
        const oldImagePath = path.join(__dirname, '..', product.image);
        if (fs.existsSync(oldImagePath)) {
          try { fs.unlinkSync(oldImagePath); } catch (e) { console.error(e); }
        }
      }
      product.image = `/uploads/products/${req.files['image'][0].filename}`;
    }

    // New Offer Image
    if (req.files && req.files['offerImage']) {
      if (product.offerImage) {
        const oldOfferPath = path.join(__dirname, '..', product.offerImage);
        if (fs.existsSync(oldOfferPath)) {
          try { fs.unlinkSync(oldOfferPath); } catch (e) { console.error(e); }
        }
      }
      product.offerImage = `/uploads/products/${req.files['offerImage'][0].filename}`;
    }

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

// 4. DELETE PRODUCT
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found!' });
    }

    if (product.image) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) { console.error(e); }
      }
    }

    if (product.offerImage) {
      const offerPath = path.join(__dirname, '..', product.offerImage);
      if (fs.existsSync(offerPath)) {
        try { fs.unlinkSync(offerPath); } catch (e) { console.error(e); }
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: '🗑️ Sweet deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed: ' + error.message });
  }
});

module.exports = router;