// routes/returnRefundPolicyRoutes.js
const express = require('express');
const router = express.Router();
const ReturnRefundPolicy = require('../models/ReturnRefundPolicy');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * GET /api/return-refund-policy
 * Public — fetch the Return & Refund Policy content shown on the storefront.
 * Treated as a singleton (only one document is expected to exist at a time).
 */
router.get('/', async (req, res) => {
  try {
    const content = await ReturnRefundPolicy.findOne().sort({ createdAt: -1 });
    if (!content) {
      return res.status(404).json({ message: 'Return & Refund Policy has not been set up yet.' });
    }
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch policy content', error: err.message });
  }
});

/**
 * POST /api/return-refund-policy
 * Admin only — create the policy content for the first time.
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const existing = await ReturnRefundPolicy.findOne();
    if (existing) {
      return res.status(400).json({
        message: 'Policy content already exists. Use PUT /api/return-refund-policy/:id to update it instead.'
      });
    }

    const content = new ReturnRefundPolicy(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create policy content', error: err.message });
  }
});

/**
 * PUT /api/return-refund-policy/:id
 * Admin only — update existing policy content.
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const updated = await ReturnRefundPolicy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'Policy content not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update policy content', error: err.message });
  }
});

/**
 * DELETE /api/return-refund-policy/:id
 * Admin only — delete the policy content entirely.
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await ReturnRefundPolicy.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Policy content not found' });
    }
    res.json({ message: 'Policy content deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete policy content', error: err.message });
  }
});

module.exports = router;