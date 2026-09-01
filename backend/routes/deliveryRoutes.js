const express = require('express');
const router = express.Router();
const DeliveryPincode = require('../models/DeliveryPincode');
const StoreSetting = require('../models/StoreSetting');

/* =========================================================
   🎁 STORE SETTINGS (Gift Box + Tax)
   GET  /api/delivery/settings
   PUT  /api/delivery/settings
   ⚠️ Ye routes '/:id' wale routes se PEHLE hone chahiye.
   ========================================================= */

// Settings hamesha exist karein (na ho to default bana do)
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
      return res.status(400).json({ success: false, message: 'Pincode aur Delivery Charge zaroori hai' });
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

// Create / Upsert — dono routes handle honge
router.post('/', handleSetPincode);
router.post('/admin/set-pincode', handleSetPincode);

// 📋 SAARE PINCODES KI LIST (admin panel ke liye)
router.get('/admin/pincodes', async (req, res) => {
  try {
    const list = await DeliveryPincode.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✏️ UPDATE ek pincode (id se)
router.put('/admin/pincode/:id', async (req, res) => {
  try {
    const { pincode, city, deliveryCharge, isServiceable } = req.body;

    const entry = await DeliveryPincode.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Pincode entry nahi mili' });
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
    // Duplicate pincode par clean message
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ye pincode pehle se list me hai.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔁 SERVICEABLE ON/OFF quick toggle
router.patch('/admin/pincode/:id/toggle', async (req, res) => {
  try {
    const entry = await DeliveryPincode.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Pincode entry nahi mili' });
    }

    entry.isServiceable = !entry.isServiceable;
    await entry.save();

    res.json({
      success: true,
      message: entry.isServiceable ? '✅ Delivery ON kar di gayi' : '⛔ Delivery OFF kar di gayi',
      data: entry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🗑️ DELETE ek pincode
router.delete('/admin/pincode/:id', async (req, res) => {
  try {
    const deleted = await DeliveryPincode.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Pincode entry nahi mili' });
    }
    res.json({ success: true, message: '🗑️ Pincode deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================
   👤 USER API — pincode par delivery charge check
   ========================================================= */
router.post('/check-delivery-charge', async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({ success: false, message: 'Pincode enter karein' });
    }

    const pincodeData = await DeliveryPincode.findOne({ pincode: String(pincode).trim() });

    if (!pincodeData || !pincodeData.isServiceable) {
      return res.status(404).json({
        success: false,
        isServiceable: false,
        message: 'Sorry, is pincode par delivery available nahi hai.',
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