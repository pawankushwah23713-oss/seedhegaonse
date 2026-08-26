const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const HomeBanner = require('../models/HomeBanner');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. PUBLIC: Get Active Banners
router.get('/', async (req, res) => {
  try {
    const banners = await HomeBanner.find({ isActive: true }).sort({ orderIndex: 1, createdAt: -1 });
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. ADMIN: Create Banner with Image Upload
router.post('/', protect, adminOnly, upload.single('bannerImage'), async (req, res) => {
  try {
    const { title, subtitle, badgeText, linkUrl, flashSaleEndTime } = req.body;
    if (!title || !req.file) {
      return res.status(400).json({ message: 'Banner title and image are required' });
    }

    const bannerPath = `/uploads/products/${req.file.filename}`;
    const newBanner = await HomeBanner.create({
      title,
      subtitle,
      badgeText,
      linkUrl,
      flashSaleEndTime: flashSaleEndTime ? new Date(flashSaleEndTime) : null,
      bannerImage: bannerPath
    });

    res.status(201).json({ message: 'Homepage banner added', banner: newBanner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. ADMIN: Delete Banner
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const banner = await HomeBanner.findById(req.params.id);
    if (banner && banner.bannerImage) {
      const imgPath = path.join(process.cwd(), banner.bannerImage);
      if (fs.existsSync(imgPath)) try { fs.unlinkSync(imgPath); } catch(e){}
    }
    await HomeBanner.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;