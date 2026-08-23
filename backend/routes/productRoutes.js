const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const Product = require('../models/Product');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Multer upload fields
const productUploads = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'offerImage', maxCount: 1 }
]);

// Upload error catcher middleware
const handleUpload = (req, res, next) => {
  productUploads(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer Error: ${err.message}` });
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
router.post('/', protect, adminOnly, handleUpload, async (req, res) => {
  try {
    const { name, originRegion, price, originalPrice, discount, offerText, category, description } = req.body;

    if (!name || !originRegion || !price || !category) {
      return res.status(400).json({ message: 'Required fields missing: name, originRegion, price, category' });
    }

    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      return res.status(400).json({ message: 'Please upload the main sweet product image.' });
    }

    const imagePath = `/uploads/products/${req.files['image'][0].filename}`;
    const offerImagePath = req.files['offerImage'] && req.files['offerImage'].length > 0
      ? `/uploads/products/${req.files['offerImage'][0].filename}`
      : '';

    const newProduct = await Product.create({
      name: String(name).trim(),
      originRegion: String(originRegion).trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      discount: discount ? Number(discount) : 0,
      offerText: offerText ? String(offerText).trim() : '',
      offerImage: offerImagePath,
      category,
      description: description ? String(description).trim() : '',
      image: imagePath
    });

    res.status(201).json({
      message: '🎉 Sweet added successfully with offer details!',
      product: newProduct
    });
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ message: error.message || 'Server failed to save product' });
  }
});

// 3. EDIT / UPDATE PRODUCT
router.put('/:id', protect, adminOnly, handleUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, originRegion, price, originalPrice, discount, offerText, category, description, inStock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Sweet product not found!' });
    }

    // Main Image
    if (req.files && req.files['image']) {
      if (product.image) {
        const oldImagePath = path.join(process.cwd(), product.image);
        if (fs.existsSync(oldImagePath)) {
          try { fs.unlinkSync(oldImagePath); } catch (e) { console.error(e); }
        }
      }
      product.image = `/uploads/products/${req.files['image'][0].filename}`;
    }

    // Offer Image
    if (req.files && req.files['offerImage']) {
      if (product.offerImage) {
        const oldOfferPath = path.join(process.cwd(), product.offerImage);
        if (fs.existsSync(oldOfferPath)) {
          try { fs.unlinkSync(oldOfferPath); } catch (e) { console.error(e); }
        }
      }
      product.offerImage = `/uploads/products/${req.files['offerImage'][0].filename}`;
    }

    if (name) product.name = String(name).trim();
    if (originRegion) product.originRegion = String(originRegion).trim();
    if (price) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice) || 0;
    if (discount !== undefined) product.discount = Number(discount) || 0;
    if (offerText !== undefined) product.offerText = String(offerText).trim();
    if (category) product.category = category;
    if (description !== undefined) product.description = String(description).trim();
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
      const imagePath = path.join(process.cwd(), product.image);
      if (fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) { console.error(e); }
      }
    }

    if (product.offerImage) {
      const offerPath = path.join(process.cwd(), product.offerImage);
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