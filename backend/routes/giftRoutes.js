const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const GiftMilestone = require('../models/GiftMilestone');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. PUBLIC: Fetch active gift milestones
router.get('/', async (req, res) => {
  try {
    const gifts = await GiftMilestone.find({ isActive: true }).sort({ minOrder: 1 });
    res.status(200).json(gifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. ADMIN: Get all gifts
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const gifts = await GiftMilestone.find().sort({ minOrder: 1 });
    res.status(200).json(gifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. ADMIN: Create Gift Milestone with Image
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { title, minOrder, description } = req.body;
    if (!title || !minOrder || !req.file) {
      return res.status(400).json({ message: 'Title, min order value and gift image are required' });
    }

    const imagePath = `/uploads/products/${req.file.filename}`;
    const newGift = await GiftMilestone.create({
      title,
      minOrder: Number(minOrder),
      description,
      image: imagePath
    });

    res.status(201).json({ message: 'Gift milestone created', gift: newGift });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. ADMIN: Delete Gift Milestone
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const gift = await GiftMilestone.findById(req.params.id);
    if (gift && gift.image) {
      const imgPath = path.join(process.cwd(), gift.image);
      if (fs.existsSync(imgPath)) try { fs.unlinkSync(imgPath); } catch(e){}
    }
    await GiftMilestone.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Gift milestone removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;