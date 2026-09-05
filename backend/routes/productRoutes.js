const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const RawProduct = require('../models/Product');
const Product = RawProduct.default || RawProduct.Product || RawProduct;

const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

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

const parseBool = (val, fallback = false) => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'boolean') return val;
  const v = String(val).trim().toLowerCase();
  if (['true', '1', 'yes', 'instock', 'in_stock'].includes(v)) return true;
  if (['false', '0', 'no', 'outofstock', 'out_of_stock'].includes(v)) return false;
  return fallback;
};

// 1. GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();

    // Safe memory sort by productRank (handles missing fields gracefully)
    products.sort((a, b) => {
      const rankA = Number(a.productRank) || 9999;
      const rankB = Number(b.productRank) || 9999;
      return rankA - rankB;
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
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
router.post('/', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.originRegion || !b.category) {
      return res.status(400).json({ message: 'Name, origin place, and category are required.' });
    }

    const uploadedFiles = req.files || [];
    const imagePaths = uploadedFiles.map((file) => `/uploads/products/${file.filename}`);

    const parsedVariants = safeJsonParse(b.variants);
    const parsedGiftTiers = safeJsonParse(b.giftTiers);
    const parsedCouponsList = safeJsonParse(b.couponsList);
    const parsedQuantityDiscounts = safeJsonParse(b.quantityDiscounts);

    // Auto-calculate inStock
    let inStockStatus = parseBool(b.inStock, true);
    if (parsedVariants.length > 0) {
      const totalQty = parsedVariants.reduce((sum, v) => sum + (Number(v.quantityAvailable) || 0), 0);
      inStockStatus = totalQty > 0;
    }

    // Determine price fallback safely (never let it be NaN or empty)
    let calculatedPrice = Number(b.price);
    if (isNaN(calculatedPrice) || calculatedPrice <= 0) {
      calculatedPrice = parsedVariants.length > 0 ? Number(parsedVariants[0].price || 0) : 0;
    }

    const productData = {
      name: String(b.name).trim(),
      category: b.category,
      productRank: Number(b.productRank) || 1,
      latestProduct: parseBool(b.latestProduct, false),
      skuNo: String(b.skuNo || '').trim(),
      originRegion: String(b.originRegion).trim(),
      description: b.description || '',

      shelfLife: b.shelfLife || '',
      preservation: b.preservation || '',
      desiGhee: b.desiGhee || '',
      hygiene: b.hygiene || '',

      gstRate: Number(b.gstRate) || 0,
      hsnCode: b.hsnCode || '',

      variants: parsedVariants,
      price: calculatedPrice,
      originalPrice: Number(b.originalPrice) || 0,

      images: imagePaths,
      image: imagePaths[0] || '',

      discountPercent: Number(b.discountPercent) || 0,
      discountValidUntil: b.discountValidUntil ? new Date(b.discountValidUntil) : null,

      giftTiers: parsedGiftTiers,
      couponsList: parsedCouponsList,
      quantityDiscounts: parsedQuantityDiscounts,
      isFreeDelivery: parseBool(b.isFreeDelivery, false),
      inStock: inStockStatus
    };

    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ message: '🎉 Product saved successfully!', product: newProduct });
  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).json({ message: error.message || 'Server error saving product.' });
  }
});

// 4. UPDATE PRODUCT (Admin Edit)
router.put('/:id', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found!' });

    const b = req.body;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/products/${file.filename}`);
      product.images = newImages;
      product.image = newImages[0];
    }

    if (b.name) product.name = String(b.name).trim();
    if (b.category) product.category = b.category;
    if (b.productRank !== undefined) product.productRank = Number(b.productRank) || 0;
    if (b.latestProduct !== undefined) product.latestProduct = parseBool(b.latestProduct, false);
    if (b.skuNo !== undefined) product.skuNo = b.skuNo;
    if (b.originRegion) product.originRegion = String(b.originRegion).trim();
    if (b.description !== undefined) product.description = b.description;

    if (b.shelfLife !== undefined) product.shelfLife = b.shelfLife;
    if (b.preservation !== undefined) product.preservation = b.preservation;
    if (b.desiGhee !== undefined) product.desiGhee = b.desiGhee;
    if (b.hygiene !== undefined) product.hygiene = b.hygiene;

    if (b.gstRate !== undefined) product.gstRate = Number(b.gstRate) || 0;
    if (b.hsnCode !== undefined) product.hsnCode = b.hsnCode;

    if (b.variants !== undefined) {
      const parsedVariants = safeJsonParse(b.variants);
      product.variants = parsedVariants;
      if (parsedVariants.length > 0) {
        product.price = Number(parsedVariants[0].price || product.price);
        const totalQty = parsedVariants.reduce((sum, v) => sum + (Number(v.quantityAvailable) || 0), 0);
        product.inStock = totalQty > 0;
      }
    } else if (b.price !== undefined && !isNaN(Number(b.price))) {
      product.price = Number(b.price);
    }

    if (b.originalPrice !== undefined) product.originalPrice = Number(b.originalPrice) || 0;
    if (b.discountPercent !== undefined) product.discountPercent = Number(b.discountPercent) || 0;
    if (b.discountValidUntil !== undefined) product.discountValidUntil = b.discountValidUntil ? new Date(b.discountValidUntil) : null;

    if (b.giftTiers !== undefined) product.giftTiers = safeJsonParse(b.giftTiers);
    if (b.couponsList !== undefined) product.couponsList = safeJsonParse(b.couponsList);
    if (b.quantityDiscounts !== undefined) product.quantityDiscounts = safeJsonParse(b.quantityDiscounts);
    if (b.isFreeDelivery !== undefined) product.isFreeDelivery = parseBool(b.isFreeDelivery, product.isFreeDelivery);
    if (b.inStock !== undefined) product.inStock = parseBool(b.inStock, product.inStock);

    const updated = await product.save();
    res.status(200).json({ message: '🎉 Product updated successfully!', product: updated });
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

    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        const imgPath = path.join(process.cwd(), img);
        if (fs.existsSync(imgPath)) try { fs.unlinkSync(imgPath); } catch (e) {}
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;