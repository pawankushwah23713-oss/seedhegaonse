const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const RawProduct = require('../models/Product');
// 🟢 Fail-safe Import: Handles both CommonJS module.exports and ES default exports
const Product = RawProduct.default || RawProduct.Product || RawProduct;

const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Safe JSON array parser for multipart form-data
const safeJsonParse = (val, fallback = []) => {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
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
    const b = req.body;

    if (!b.name || !b.originRegion || !b.price || !b.category) {
      return res.status(400).json({ message: 'Name, origin, category, and price are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Product image is required.' });
    }

    const imagePath = `/uploads/products/${req.file.filename}`;

    // Parse all dynamic '+' arrays
    const parsedBulkTiers = safeJsonParse(b.bulkTiers);
    const parsedGiftTiers = safeJsonParse(b.giftTiers);
    const parsedCouponsList = safeJsonParse(b.couponsList);
    const parsedQuantityDiscounts = safeJsonParse(b.quantityDiscounts);

    const productData = {
      name: String(b.name).trim(),
      originRegion: String(b.originRegion).trim(),
      category: b.category,
      description: b.description || '',
      image: imagePath,
      price: Number(b.price),
      originalPrice: Number(b.originalPrice) || 0,
      discountPercent: Number(b.discountPercent) || 0,
      discountValidUntil: b.discountValidUntil ? new Date(b.discountValidUntil) : null,

      // Dynamic Slabs
      bulkTiers: parsedBulkTiers,
      giftTiers: parsedGiftTiers,
      couponsList: parsedCouponsList,
      quantityDiscounts: parsedQuantityDiscounts,

      // Single field fallbacks
      highValueThreshold: parsedBulkTiers.length > 0 ? Number(parsedBulkTiers[0].minSpend || 0) : Number(b.highValueThreshold || 0),
      highValueDiscountPercent: parsedBulkTiers.length > 0 ? Number(parsedBulkTiers[0].discountValue || parsedBulkTiers[0].discountPercent || 0) : Number(b.highValueDiscountPercent || 0),
      productCouponCode: parsedCouponsList.length > 0 ? parsedCouponsList[0].code : (b.productCouponCode || ''),
      productCouponDiscount: parsedCouponsList.length > 0 ? Number(parsedCouponsList[0].discountValue || 0) : Number(b.productCouponDiscount || 0),
      productCouponType: parsedCouponsList.length > 0 ? parsedCouponsList[0].discountType : (b.productCouponType || 'flat'),

      isFreeDelivery: b.isFreeDelivery === 'true' || b.isFreeDelivery === true
    };

    // 🟢 Safe Save using new instance
    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ message: '🎉 Product with all dynamic slabs saved successfully!', product: newProduct });
  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).json({ message: error.message || 'Server error saving product.' });
  }
});

// 4. UPDATE PRODUCT (Admin Edit)
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found!' });

    if (req.file) {
      if (product.image) {
        const oldPath = path.join(process.cwd(), product.image);
        if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath); } catch (e) {}
      }
      product.image = `/uploads/products/${req.file.filename}`;
    }

    const b = req.body;
    if (b.name) product.name = String(b.name).trim();
    if (b.originRegion) product.originRegion = String(b.originRegion).trim();
    if (b.category) product.category = b.category;
    if (b.description !== undefined) product.description = b.description;
    if (b.price) product.price = Number(b.price);
    if (b.originalPrice !== undefined) product.originalPrice = Number(b.originalPrice) || 0;

    // Timeline Discount
    product.discountPercent = Number(b.discountPercent) || 0;
    product.discountValidUntil = b.discountValidUntil ? new Date(b.discountValidUntil) : null;

    // Update Dynamic Arrays
    if (b.bulkTiers !== undefined) product.bulkTiers = safeJsonParse(b.bulkTiers);
    if (b.giftTiers !== undefined) product.giftTiers = safeJsonParse(b.giftTiers);
    if (b.couponsList !== undefined) product.couponsList = safeJsonParse(b.couponsList);
    if (b.quantityDiscounts !== undefined) product.quantityDiscounts = safeJsonParse(b.quantityDiscounts);

    // Fallbacks
    if (product.bulkTiers && product.bulkTiers.length > 0) {
      product.highValueThreshold = Number(product.bulkTiers[0].minSpend || 0);
      product.highValueDiscountPercent = Number(product.bulkTiers[0].discountValue || product.bulkTiers[0].discountPercent || 0);
    }
    if (product.couponsList && product.couponsList.length > 0) {
      product.productCouponCode = product.couponsList[0].code || '';
      product.productCouponDiscount = Number(product.couponsList[0].discountValue || 0);
      product.productCouponType = product.couponsList[0].discountType || 'flat';
    }

    if (b.isFreeDelivery !== undefined) {
      product.isFreeDelivery = b.isFreeDelivery === 'true' || b.isFreeDelivery === true;
    }
    if (b.inStock !== undefined) {
      product.inStock = b.inStock === 'true' || b.inStock === true;
    }

    const updated = await product.save();
    res.status(200).json({ message: '🎉 Product updated with all slabs successfully!', product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: error.message || 'Server error updating product.' });
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