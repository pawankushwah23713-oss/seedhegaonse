const express = require('express');
const router = express.Router();
const {
  fetchSettings,
  saveSettings
} = require('../controllers/storeSettingsController');

// 1. Settings Fetch (CartDrawer aur Checkout ke liye)
router.get('/settings', fetchSettings);

// 2. Admin Settings Update (COD on/off karne ke liye)
router.put('/settings', saveSettings);
router.post('/settings', saveSettings);

module.exports = router;