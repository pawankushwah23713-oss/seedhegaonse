// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// slugify a display name into a safe "value" used on products
const toValue = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// 🟢 NEW: normalize a menuGroup string (falls back to 'sweets' when empty)
const toMenuGroup = (group) => {
  const g = String(group || '').trim();
  return g || 'sweets';
};

/**
 * GET /api/categories
 * Public — active categories only, sorted for use in the product dropdown
 * and the navbar (navbar groups these client-side by menuGroup).
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

/**
 * GET /api/categories/all
 * Admin only — every category (active + inactive) for the manage view.
 */
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

/**
 * POST /api/categories
 * Admin only — add a new category. This is what makes a typed category
 * permanent instead of one-off. Accepts an optional menuGroup so the admin
 * can choose which navbar dropdown (existing or brand new) it lands in.
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const value = toValue(name);
    const menuGroup = toMenuGroup(req.body.menuGroup); // 🟢 NEW

    const existing = await Category.findOne({ value });
    if (existing) {
      // Already exists — just return it instead of erroring, so re-adding
      // the same category name from the product form doesn't break anything.
      return res.status(200).json(existing);
    }

    const category = new Category({
      name,
      value,
      order: Number(req.body.order) || 0,
      menuGroup // 🟢 NEW
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
});

/**
 * PUT /api/categories/:id
 * Admin only — rename, reorder, activate/deactivate, or move a category to
 * a different navbar dropdown (menuGroup).
 * Note: renaming only changes the display name; the stored "value" on
 * existing products is untouched unless you explicitly update it here.
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body.order !== undefined) update.order = Number(req.body.order) || 0;
    if (req.body.isActive !== undefined) update.isActive = !!req.body.isActive;
    if (req.body.menuGroup !== undefined) update.menuGroup = toMenuGroup(req.body.menuGroup); // 🟢 NEW

    const updated = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category', error: err.message });
  }
});

/**
 * DELETE /api/categories/:id
 * Admin only — remove a category from the list. Existing products keep
 * whatever category value they already had; only the dropdown option is
 * removed for future use.
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
});

module.exports = router;

/*
  Register in server.js alongside your other routes:

    const categoryRoutes = require('./routes/categoryRoutes');
    app.use('/api/categories', categoryRoutes);
*/