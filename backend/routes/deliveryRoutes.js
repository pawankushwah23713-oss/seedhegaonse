const express = require('express');
const router = express.Router();
const DeliveryPincode = require('../models/DeliveryPincode');
const StoreSetting = require('../models/StoreSetting');

/* =========================================================
   🎁 STORE SETTINGS (Gift Box + Tax)
   GET  /api/delivery/settings
   PUT  /api/delivery/settings
   ⚠️ These routes must be placed BEFORE '/:id' routes.
   ========================================================= */

// Ensure settings always exist (create default if not found)
const getOrCreateSettings = async () => {
  let settings = await StoreSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await StoreSetting.create({ key: 'global' });
  }
  return settings;
};

router.get('/settings', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const b = req.body || {};
    const settings = await getOrCreateSettings();

    if (b.giftBoxEnabled !== undefined) {
      settings.giftBoxEnabled = b.giftBoxEnabled === true || b.giftBoxEnabled === 'true';
    }
    if (b.giftBoxTitle !== undefined) {
      settings.giftBoxTitle = String(b.giftBoxTitle).trim() || 'Gift Box wrap';
    }
    if (b.giftBoxCharge !== undefined) {
      settings.giftBoxCharge = Math.max(0, Number(b.giftBoxCharge) || 0);
    }
    if (b.productTaxPercent !== undefined) {
      settings.productTaxPercent = Math.min(100, Math.max(0, Number(b.productTaxPercent) || 0));
    }
    if (b.shippingTaxPercent !== undefined) {
      settings.shippingTaxPercent = Math.min(100, Math.max(0, Number(b.shippingTaxPercent) || 0));
    }

    await settings.save();
    res.json({ success: true, message: '✅ Store settings updated successfully!', settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================
   📍 PINCODE MANAGEMENT (Create / Read / Update / Delete)
   ========================================================= */

const handleSetPincode = async (req, res) => {
  try {
    const { pincode, city, deliveryCharge, isServiceable } = req.body;

    if (!pincode || deliveryCharge === undefined) {
      return res.status(400).json({ success: false, message: 'Pincode and Delivery Charge are required.' });
    }

    const result = await DeliveryPincode.findOneAndUpdate(
      { pincode: String(pincode).trim() },
      {
        city: city ? String(city).trim() : '',
        deliveryCharge: Number(deliveryCharge),
        isServiceable: isServiceable !== undefined ? isServiceable : true
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Pincode delivery rate saved successfully!', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create / Upsert — handles both endpoints
router.post('/', handleSetPincode);
router.post('/admin/set-pincode', handleSetPincode);

// 📋 GET ALL PINCODES (For Admin Panel)
router.get('/admin/pincodes', async (req, res) => {
  try {
    const list = await DeliveryPincode.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✏️ UPDATE a single pincode (by ID)
router.put('/admin/pincode/:id', async (req, res) => {
  try {
    const { pincode, city, deliveryCharge, isServiceable } = req.body;

    const entry = await DeliveryPincode.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Pincode entry not found.' });
    }

    if (pincode !== undefined) entry.pincode = String(pincode).trim();
    if (city !== undefined) entry.city = String(city).trim();
    if (deliveryCharge !== undefined) entry.deliveryCharge = Number(deliveryCharge) || 0;
    if (isServiceable !== undefined) {
      entry.isServiceable = isServiceable === true || isServiceable === 'true';
    }

    await entry.save();
    res.json({ success: true, message: '✅ Pincode updated successfully!', data: entry });
  } catch (error) {
    // Duplicate pincode error handler
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This pincode already exists in the list.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔁 SERVICEABLE ON/OFF quick toggle
router.patch('/admin/pincode/:id/toggle', async (req, res) => {
  try {
    const entry = await DeliveryPincode.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Pincode entry not found.' });
    }

    entry.isServiceable = !entry.isServiceable;
    await entry.save();

    res.json({
      success: true,
      message: entry.isServiceable ? '✅ Delivery service enabled.' : '⛔ Delivery service disabled.',
      data: entry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🗑️ DELETE a pincode
router.delete('/admin/pincode/:id', async (req, res) => {
  try {
    const deleted = await DeliveryPincode.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Pincode entry not found.' });
    }
    res.json({ success: true, message: '🗑️ Pincode deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================
   👤 USER API — Check delivery charge by pincode
   ========================================================= */
router.post('/check-delivery-charge', async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({ success: false, message: 'Please enter a pincode.' });
    }

    const pincodeData = await DeliveryPincode.findOne({ pincode: String(pincode).trim() });

    if (!pincodeData || !pincodeData.isServiceable) {
      return res.status(404).json({
        success: false,
        isServiceable: false,
        message: 'Sorry, delivery is not available for this pincode.',
        deliveryCharge: 0
      });
    }

    res.json({
      success: true,
      isServiceable: true,
      city: pincodeData.city || '',
      deliveryCharge: pincodeData.deliveryCharge,
      message: `Delivery Charge: ₹${pincodeData.deliveryCharge}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;