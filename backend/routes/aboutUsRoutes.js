// routes/aboutUsRoutes.js
const express = require('express');
const router = express.Router();
const AboutUs = require('../models/AboutUs');

const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * GET /api/aboutus
 * Public — fetch the About Us content shown on the storefront.
 * Since this is a single "page" of content, we treat it as a singleton
 * (only one document is expected to exist at a time).
 */
router.get('/', async (req, res) => {
  try {
    const content = await AboutUs.findOne().sort({ createdAt: -1 });
    if (!content) {
      return res.status(404).json({ message: 'About Us content has not been set up yet.' });
    }
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch About Us content', error: err.message });
  }
});

/**
 * POST /api/aboutus
 * Admin only — create the About Us content for the first time.
 * If content already exists, this responds with an error asking to use PUT instead,
 * so we never end up with duplicate "pages" by mistake.
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const existing = await AboutUs.findOne();
    if (existing) {
      return res.status(400).json({
        message: 'About Us content already exists. Use PUT /api/aboutus/:id to update it instead.'
      });
    }

    const content = new AboutUs(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create About Us content', error: err.message });
  }
});

/**
 * PUT /api/aboutus/:id
 * Admin only — update existing About Us content.
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const updated = await AboutUs.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'About Us content not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update About Us content', error: err.message });
  }
});

/**
 * DELETE /api/aboutus/:id
 * Admin only — delete the About Us content entirely (resets the storefront page to empty).
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await AboutUs.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'About Us content not found' });
    }
    res.json({ message: 'About Us content deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete About Us content', error: err.message });
  }
});

module.exports = router;

/*
  Don't forget to register this router in your main server file (e.g. server.js / app.js):

    const aboutUsRoutes = require('./routes/aboutUsRoutes');
    app.use('/api/aboutus', aboutUsRoutes);
*/