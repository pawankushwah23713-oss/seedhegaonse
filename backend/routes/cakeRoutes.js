const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const RawCake = require('../models/Cake');
const Cake = RawCake.default || RawCake.Cake || RawCake;

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

// 🟢 Boolean parser
const parseBool = (val, fallback = false) => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'boolean') return val;
  const v = String(val).trim().toLowerCase();
  if (['true', '1', 'yes', 'instock', 'in_stock'].includes(v)) return true;
  if (['false', '0', 'no', 'outofstock', 'out_of_stock'].includes(v)) return false;
  return fallback;
};

// 1. GET ALL CAKES
router.get('/', async (req, res) => {
  try {
    const cakes = await Cake.find().sort({ createdAt: -1 });
    res.status(200).json(cakes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cakes: ' + error.message });
  }
});

// 2. GET SINGLE CAKE
router.get('/:id', async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ message: 'Cake not found' });
    res.status(200).json(cake);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. CREATE CAKE (Admin)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const b = req.body;

    if (!b.name || !b.price || !b.category) {
      return res.status(400).json({ message: 'Cake Name, category, and price are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Cake image is required.' });
    }

    const imagePath = `/uploads/products/${req.file.filename}`;

    const parsedBulkTiers = safeJsonParse(b.bulkTiers);
    const parsedGiftTiers = safeJsonParse(b.giftTiers);
    const parsedCouponsList = safeJsonParse(b.couponsList);
    const parsedQuantityDiscounts = safeJsonParse(b.quantityDiscounts);

    const cakeData = {
      name: String(b.name).trim(),
      originRegion: String(b.originRegion || 'Fresh Bakehouse').trim(),
      category: b.category,
      description: b.description || '',
      image: imagePath,
      price: Number(b.price),
      originalPrice: Number(b.originalPrice) || 0,
      discountPercent: Number(b.discountPercent) || 0,
      discountValidUntil: b.discountValidUntil ? new Date(b.discountValidUntil) : null,

      bulkTiers: parsedBulkTiers,
      giftTiers: parsedGiftTiers,
      couponsList: parsedCouponsList,
      quantityDiscounts: parsedQuantityDiscounts,

      highValueThreshold: parsedBulkTiers.length > 0 ? Number(parsedBulkTiers[0].minSpend || 0) : Number(b.highValueThreshold || 0),
      highValueDiscountPercent: parsedBulkTiers.length > 0 ? Number(parsedBulkTiers[0].discountValue || parsedBulkTiers[0].discountPercent || 0) : Number(b.highValueDiscountPercent || 0),
      productCouponCode: parsedCouponsList.length > 0 ? parsedCouponsList[0].code : (b.productCouponCode || ''),
      productCouponDiscount: parsedCouponsList.length > 0 ? Number(parsedCouponsList[0].discountValue || 0) : Number(b.productCouponDiscount || 0),
      productCouponType: parsedCouponsList.length > 0 ? parsedCouponsList[0].discountType : (b.productCouponType || 'flat'),

      isFreeDelivery: parseBool(b.isFreeDelivery, false),
      inStock: parseBool(b.inStock, true)
    };

    const newCake = new Cake(cakeData);
    await newCake.save();

    res.status(201).json({ message: '🎉 Cake saved successfully!', cake: newCake });
  } catch (error) {
    console.error('Save cake error:', error);
    res.status(500).json({ message: error.message || 'Server error saving cake.' });
  }
});

// 4. UPDATE CAKE (Admin Edit)
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ message: 'Cake not found!' });

    if (req.file) {
      if (cake.image) {
        const oldPath = path.join(process.cwd(), cake.image);
        if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath); } catch (e) {}
      }
      cake.image = `/uploads/products/${req.file.filename}`;
    }

    const b = req.body;
    if (b.name) cake.name = String(b.name).trim();
    if (b.originRegion !== undefined) cake.originRegion = String(b.originRegion).trim();
    if (b.category) cake.category = b.category;
    if (b.description !== undefined) cake.description = b.description;
    if (b.price) cake.price = Number(b.price);
    if (b.originalPrice !== undefined) cake.originalPrice = Number(b.originalPrice) || 0;

    if (b.discountPercent !== undefined) cake.discountPercent = Number(b.discountPercent) || 0;
    if (b.discountValidUntil !== undefined) {
      cake.discountValidUntil = b.discountValidUntil ? new Date(b.discountValidUntil) : null;
    }

    if (b.bulkTiers !== undefined) cake.bulkTiers = safeJsonParse(b.bulkTiers);
    if (b.giftTiers !== undefined) cake.giftTiers = safeJsonParse(b.giftTiers);
    if (b.couponsList !== undefined) cake.couponsList = safeJsonParse(b.couponsList);
    if (b.quantityDiscounts !== undefined) cake.quantityDiscounts = safeJsonParse(b.quantityDiscounts);

    if (cake.bulkTiers && cake.bulkTiers.length > 0) {
      cake.highValueThreshold = Number(cake.bulkTiers[0].minSpend || 0);
      cake.highValueDiscountPercent = Number(cake.bulkTiers[0].discountValue || cake.bulkTiers[0].discountPercent || 0);
    }
    if (cake.couponsList && cake.couponsList.length > 0) {
      cake.productCouponCode = cake.couponsList[0].code || '';
      cake.productCouponDiscount = Number(cake.couponsList[0].discountValue || 0);
      cake.productCouponType = cake.couponsList[0].discountType || 'flat';
    }

    if (b.isFreeDelivery !== undefined) {
      cake.isFreeDelivery = parseBool(b.isFreeDelivery, cake.isFreeDelivery);
    }

    if (b.inStock !== undefined) {
      cake.inStock = parseBool(b.inStock, cake.inStock !== false);
    }

    const updated = await cake.save();
    res.status(200).json({ message: '🎉 Cake updated successfully!', cake: updated });
  } catch (error) {
    console.error('Update cake error:', error);
    res.status(500).json({ message: error.message || 'Server error updating cake.' });
  }
});

// 5. QUICK STOCK TOGGLE
router.patch('/:id/stock', protect, adminOnly, async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ message: 'Cake not found!' });

    cake.inStock = parseBool(req.body.inStock, !(cake.inStock !== false));
    await cake.save();

    res.status(200).json({
      message: cake.inStock ? '✅ Cake marked IN STOCK' : '⛔ Cake marked OUT OF STOCK',
      cake
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Stock update failed' });
  }
});

// 6. DELETE CAKE
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ message: 'Cake not found!' });

    if (cake.image) {
      const imgPath = path.join(process.cwd(), cake.image);
      if (fs.existsSync(imgPath)) try { fs.unlinkSync(imgPath); } catch (e) {}
    }

    await Cake.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Cake deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;