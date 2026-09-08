// routes/socialLinkRoutes.js
const express = require('express');
const router = express.Router();
const SocialLink = require('../models/SocialLink');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * GET /api/social-links
 * Public — returns only ACTIVE links, sorted by "order" ascending.
 * This is what your public footer/header should call to render icons.
 */
router.get('/', async (req, res) => {
  try {
    const links = await SocialLink.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch social links', error: err.message });
  }
});

/**
 * GET /api/social-links/all
 * Admin only — returns EVERY link (active + inactive) for the admin manage page.
 */
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const links = await SocialLink.find().sort({ order: 1, createdAt: 1 });
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch social links', error: err.message });
  }
});

/**
 * POST /api/social-links
 * Admin only — add a new social link.
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const link = new SocialLink(req.body);
    await link.save();
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create social link', error: err.message });
  }
});

/**
 * PUT /api/social-links/:id
 * Admin only — update an existing social link (url, order, active state, etc.)
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const updated = await SocialLink.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      return res.status(404).json({ message: 'Social link not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update social link', error: err.message });
  }
});

/**
 * DELETE /api/social-links/:id
 * Admin only — remove a social link.
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await SocialLink.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Social link not found' });
    }
    res.json({ message: 'Social link deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete social link', error: err.message });
  }
});

module.exports = router;

/*
  Register this router in your server.js / app.js:

    app.use('/api/social-links', require('./routes/socialLinkRoutes'));

  On your PUBLIC footer/header, fetch GET /api/social-links (no auth needed)
  and render one icon+link per item, in the order returned.
*/