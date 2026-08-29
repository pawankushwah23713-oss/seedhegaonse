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

// 🟢 Boolean parser (form-data se 'true'/'false' string aata hai)
const parseBool = (val, fallback = false) => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'boolean') return val;
  const v = String(val).trim().toLowerCase();
  if (['true', '1', 'yes', 'instock', 'in_stock'].includes(v)) return true;
  if (['false', '0', 'no', 'outofstock', 'out_of_stock'].includes(v)) return false;
  return fallback;
};

// 🟢 Normalizers for bulk offers
const normalizeCoupons = (list) =>
  safeJsonParse(list)
    .map((c) => ({
      code: String(c.code || '').trim().toUpperCase(),
      discountType: c.discountType === 'percentage' ? 'percentage' : 'flat',
      discountValue: Number(c.discountValue) || 0,
      minSpend: Number(c.minSpend) || 0,
      validUntil: c.validUntil ? new Date(c.validUntil) : null
    }))
    .filter((c) => c.code && c.discountValue > 0);

const normalizeQtyDiscounts = (list) =>
  safeJsonParse(list)
    .map((q) => ({
      minQty: Number(q.minQty) || 0,
      discountPercent: Number(q.discountPercent) || 0
    }))
    .filter((q) => q.minQty > 0 && q.discountPercent > 0);

const normalizeGiftTiers = (list) =>
  safeJsonParse(list)
    .map((g) => ({
      minSpend: Number(g.minSpend) || 0,
      giftTitle: String(g.giftTitle || '').trim(),
      giftImage: g.giftImage || ''
    }))
    .filter((g) => g.giftTitle);

// 1. GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sweets: ' + error.message });
  }
});

/* =========================================================================
   🌐 BULK OFFERS — SAARE PRODUCTS PAR EK SAATH OFFER LAGAO
   POST /api/products/bulk-offers
   NOTE: ye route '/:id' wale routes se PEHLE hona chahiye.

   Body (JSON):
   {
     category: 'all' | 'ladoo' | 'peda' | ...,
     mode: 'replace' | 'append' | 'remove',
     applyDiscount: true, discountPercent: 15, discountValidUntil: '2026-09-30T23:59',
     applyCoupons: true, couponsList: [{ code, discountType, discountValue, minSpend, validUntil }],
     applyQtyDiscounts: true, quantityDiscounts: [{ minQty, discountPercent }],
     applyGifts: true, giftTiers: [{ minSpend, giftTitle, giftImage }],
     applyFreeDelivery: true, isFreeDelivery: true
   }
   ========================================================================= */
router.post('/bulk-offers', protect, adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const mode = ['replace', 'append', 'remove'].includes(b.mode) ? b.mode : 'replace';

    const applyDiscount = parseBool(b.applyDiscount, false);
    const applyCoupons = parseBool(b.applyCoupons, false);
    const applyQtyDiscounts = parseBool(b.applyQtyDiscounts, false);
    const applyGifts = parseBool(b.applyGifts, false);
    const applyFreeDelivery = parseBool(b.applyFreeDelivery, false);

    if (!applyDiscount && !applyCoupons && !applyQtyDiscounts && !applyGifts && !applyFreeDelivery) {
      return res.status(400).json({ message: 'Kam se kam ek offer type select karein.' });
    }

    // Category filter
    const filter = {};
    if (b.category && b.category !== 'all') filter.category = b.category;

    const products = await Product.find(filter);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Is filter par koi product nahi mila.' });
    }

    const newCoupons = applyCoupons ? normalizeCoupons(b.couponsList) : [];
    const newQty = applyQtyDiscounts ? normalizeQtyDiscounts(b.quantityDiscounts) : [];
    const newGifts = applyGifts ? normalizeGiftTiers(b.giftTiers) : [];

    let updatedCount = 0;

    for (const product of products) {
      // ---------- ⏳ TIMELINE DISCOUNT ----------
      if (applyDiscount) {
        if (mode === 'remove') {
          product.discountPercent = 0;
          product.discountValidUntil = null;
        } else {
          product.discountPercent = Number(b.discountPercent) || 0;
          product.discountValidUntil = b.discountValidUntil ? new Date(b.discountValidUntil) : null;
        }
      }

      // ---------- 🎟️ COUPONS ----------
      if (applyCoupons) {
        if (mode === 'remove') {
          product.couponsList = [];
          product.productCouponCode = '';
          product.productCouponDiscount = 0;
          product.productCouponType = 'flat';
        } else if (mode === 'append') {
          const existing = Array.isArray(product.couponsList) ? product.couponsList.map((c) => c.toObject?.() || c) : [];
          const existingCodes = new Set(existing.map((c) => String(c.code || '').toUpperCase()));
          const merged = [...existing, ...newCoupons.filter((c) => !existingCodes.has(c.code))];
          product.couponsList = merged;
        } else {
          product.couponsList = newCoupons;
        }
      }

      // ---------- 📦 QUANTITY / PACK DISCOUNTS ----------
      if (applyQtyDiscounts) {
        if (mode === 'remove') {
          product.quantityDiscounts = [];
        } else if (mode === 'append') {
          const existing = Array.isArray(product.quantityDiscounts) ? product.quantityDiscounts.map((q) => q.toObject?.() || q) : [];
          const existingQtys = new Set(existing.map((q) => Number(q.minQty)));
          product.quantityDiscounts = [...existing, ...newQty.filter((q) => !existingQtys.has(q.minQty))];
        } else {
          product.quantityDiscounts = newQty;
        }
      }

      // ---------- 🎁 FREE GIFTS ----------
      if (applyGifts) {
        if (mode === 'remove') {
          product.giftTiers = [];
        } else if (mode === 'append') {
          const existing = Array.isArray(product.giftTiers) ? product.giftTiers.map((g) => g.toObject?.() || g) : [];
          const existingKeys = new Set(existing.map((g) => `${Number(g.minSpend)}|${String(g.giftTitle || '').toLowerCase()}`));
          product.giftTiers = [
            ...existing,
            ...newGifts.filter((g) => !existingKeys.has(`${g.minSpend}|${g.giftTitle.toLowerCase()}`))
          ];
        } else {
          product.giftTiers = newGifts;
        }
      }

      // ---------- 🚚 FREE DELIVERY ----------
      if (applyFreeDelivery) {
        product.isFreeDelivery = mode === 'remove' ? false : parseBool(b.isFreeDelivery, true);
      }

      // Backward-compatible single coupon fields
      if (applyCoupons && mode !== 'remove' && product.couponsList && product.couponsList.length > 0) {
        product.productCouponCode = product.couponsList[0].code || '';
        product.productCouponDiscount = Number(product.couponsList[0].discountValue || 0);
        product.productCouponType = product.couponsList[0].discountType || 'flat';
      }

      await product.save();
      updatedCount++;
    }

    const scope = b.category && b.category !== 'all' ? `"${b.category}" category` : 'saare products';
    const actionWord = mode === 'remove' ? 'hataye gaye' : mode === 'append' ? 'add kiye gaye' : 'set kiye gaye';

    res.status(200).json({
      message: `🎉 ${updatedCount} products par offers ${actionWord} (${scope}).`,
      updatedCount,
      mode,
      category: b.category || 'all'
    });
  } catch (error) {
    console.error('Bulk offers error:', error);
    res.status(500).json({ message: error.message || 'Bulk offer apply karne me error aaya.' });
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

      isFreeDelivery: parseBool(b.isFreeDelivery, false),

      // 🟢 STOCK STATUS (default: In Stock)
      inStock: parseBool(b.inStock, true)
    };

    // 🟢 Safe Save using new instance
    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ message: '🎉 Product saved successfully!', product: newProduct });
  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).json({ message: error.message || 'Server error saving product.' });
  }
});

// 4. UPDATE PRODUCT (Admin Edit) — partial update safe hai
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

    // Timeline Discount — sirf tab update ho jab bheja gaya ho
    // (isse sirf stock toggle karne par purana discount wipe nahi hoga)
    if (b.discountPercent !== undefined) product.discountPercent = Number(b.discountPercent) || 0;
    if (b.discountValidUntil !== undefined) {
      product.discountValidUntil = b.discountValidUntil ? new Date(b.discountValidUntil) : null;
    }

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
      product.isFreeDelivery = parseBool(b.isFreeDelivery, product.isFreeDelivery);
    }

    // 🟢 STOCK STATUS UPDATE
    if (b.inStock !== undefined) {
      product.inStock = parseBool(b.inStock, product.inStock !== false);
    }

    const updated = await product.save();
    res.status(200).json({ message: '🎉 Product updated successfully!', product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: error.message || 'Server error updating product.' });
  }
});

// 4b. 🟢 QUICK STOCK TOGGLE (optional shortcut route)
// PATCH /api/products/:id/stock   body: { inStock: true/false }
router.patch('/:id/stock', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found!' });

    product.inStock = parseBool(req.body.inStock, !(product.inStock !== false));
    await product.save();

    res.status(200).json({
      message: product.inStock ? '✅ Product marked IN STOCK' : '⛔ Product marked OUT OF STOCK',
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Stock update failed' });
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