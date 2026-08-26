const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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

// 2. GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. CREATE PRODUCT (Admin)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      originRegion,
      category,
      description,
      price,
      originalPrice,
      discountPercent,
      discountValidUntil,
      productCouponCode,
      productCouponDiscount,
      productCouponType,
      productCouponValidUntil,
      highValueThreshold,
      highValueDiscountPercent,
      isFreeDelivery
    } = req.body;

    if (!name || !originRegion || !price || !category) {
      return res.status(400).json({ message: 'Name, origin, category aur price zaroori hain.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Product photo upload karna zaroori hai.' });
    }

    const imagePath = `/uploads/products/${req.file.filename}`;

    const newProduct = await Product.create({
      name: String(name).trim(),
      originRegion: String(originRegion).trim(),
      category,
      description: description || '',
      image: imagePath,
      price: Number(price),
      originalPrice: Number(originalPrice) || 0,
      discountPercent: Number(discountPercent) || 0,
      discountValidUntil: discountValidUntil ? new Date(discountValidUntil) : null,
      productCouponCode: productCouponCode ? productCouponCode.trim().toUpperCase() : '',
      productCouponDiscount: Number(productCouponDiscount) || 0,
      productCouponType: productCouponType || 'flat',
      productCouponValidUntil: productCouponValidUntil ? new Date(productCouponValidUntil) : null,
      highValueThreshold: Number(highValueThreshold) || 0,
      highValueDiscountPercent: Number(highValueDiscountPercent) || 0,
      isFreeDelivery: isFreeDelivery === 'true' || isFreeDelivery === true
    });

    res.status(201).json({ message: 'Sweet product added successfully!', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. UPDATE PRODUCT (Admin Edit)
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found!' });

    // Agar nayi image upload hui hai toh purani delete karke nayi lagao
    if (req.file) {
      if (product.image) {
        const oldPath = path.join(process.cwd(), product.image);
        if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath); } catch (e) {}
      }
      product.image = `/uploads/products/${req.file.filename}`;
    }

    const b = req.body;
    if (b.name) product.name = b.name.trim();
    if (b.originRegion) product.originRegion = b.originRegion.trim();
    if (b.category) product.category = b.category;
    if (b.description !== undefined) product.description = b.description;
    if (b.price) product.price = Number(b.price);
    if (b.originalPrice !== undefined) product.originalPrice = Number(b.originalPrice) || 0;

    // Timeline Discount
    product.discountPercent = Number(b.discountPercent) || 0;
    product.discountValidUntil = b.discountValidUntil ? new Date(b.discountValidUntil) : null;

    // Coupon
    product.productCouponCode = b.productCouponCode ? b.productCouponCode.trim().toUpperCase() : '';
    product.productCouponDiscount = Number(b.productCouponDiscount) || 0;
    product.productCouponType = b.productCouponType || 'flat';
    product.productCouponValidUntil = b.productCouponValidUntil ? new Date(b.productCouponValidUntil) : null;

    // High value & Free shipping
    product.highValueThreshold = Number(b.highValueThreshold) || 0;
    product.highValueDiscountPercent = Number(b.highValueDiscountPercent) || 0;
    product.isFreeDelivery = b.isFreeDelivery === 'true' || b.isFreeDelivery === true;
    if (b.inStock !== undefined) product.inStock = b.inStock === 'true' || b.inStock === true;

    const updated = await product.save();
    res.status(200).json({ message: 'Sweet product updated successfully!', product: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. DELETE PRODUCT
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found!' });

    if (product.image) {
      const imgPath = path.join(process.cwd(), product.image);
      if (fs.existsSync(imgPath)) try { fs.unlinkSync(imgPath); } catch (e) {}
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;