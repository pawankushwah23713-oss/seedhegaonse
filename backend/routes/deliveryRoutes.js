const express = require('express');
const router = express.Router();
const DeliveryPincode = require('../models/DeliveryPincode');
const StoreSetting = require('../models/StoreSetting');

/* =========================================================
   🎁 STORE SETTINGS (Gift Box + Tax)
   ========================================================= */
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
   📍 PINCODE MANAGEMENT (Single as well as Multi Option)
   ========================================================= */

const handleSetPincode = async (req, res) => {
  try {
    const { pincodeInput, pincode, city, deliveryCharge, gstPercent, isServiceable } = req.body;

    const rawInput = pincodeInput || pincode;
    if (!rawInput || deliveryCharge === undefined) {
      return res.status(400).json({ success: false, message: 'Pincode and Delivery Charge are required.' });
    }

    // Split comma/space/newline separated pincodes
    const pins = String(rawInput)
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);

    if (pins.length === 0) {
      return res.status(400).json({ success: false, message: 'Please enter valid pincode(s).' });
    }

    const chargeNum = Number(deliveryCharge);
    const gstNum = gstPercent !== undefined ? Number(gstPercent) : 18;
    const serv = isServiceable !== undefined ? Boolean(isServiceable) : true;
    const cityStr = city ? String(city).trim() : '';

    // Bulk upsert for each pincode (Single or Multi)
    const operations = pins.map((pin) => ({
      updateOne: {
        filter: { pincode: pin },
        update: {
          $set: {
            pincode: pin,
            city: cityStr,
            deliveryCharge: chargeNum,
            gstPercent: gstNum,
            isServiceable: serv
          }
        },
        upsert: true
      }
    }));

    await DeliveryPincode.bulkWrite(operations);

    res.json({
      success: true,
      message: pins.length === 1
        ? `✅ Pincode ${pins[0]} saved successfully!`
        : `✅ ${pins.length} pincodes saved successfully!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/', handleSetPincode);
router.post('/admin/set-pincode', handleSetPincode);

// 📋 GET ALL PINCODES
router.get('/admin/pincodes', async (req, res) => {
  try {
    const list = await DeliveryPincode.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✏️ UPDATE SINGLE PINCODE
router.put('/admin/pincode/:id', async (req, res) => {
  try {
    const { pincodeInput, pincode, city, deliveryCharge, gstPercent, isServiceable } = req.body;
    const entry = await DeliveryPincode.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Pincode not found.' });
    }

    const pinVal = pincodeInput || pincode;
    if (pinVal !== undefined) entry.pincode = String(pinVal).trim();
    if (city !== undefined) entry.city = String(city).trim();
    if (deliveryCharge !== undefined) entry.deliveryCharge = Number(deliveryCharge) || 0;
    if (gstPercent !== undefined) entry.gstPercent = Number(gstPercent) || 0;
    if (isServiceable !== undefined) {
      entry.isServiceable = isServiceable === true || isServiceable === 'true';
    }

    await entry.save();
    res.json({ success: true, message: '✅ Pincode updated successfully!', data: entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This pincode already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔁 TOGGLE SERVICEABLE
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
      message: entry.isServiceable ? '✅ Service enabled.' : '⛔ Service disabled.',
      data: entry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🗑️ DELETE PINCODE
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

// 👤 USER CHECK DELIVERY CHARGE
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
      gstPercent: pincodeData.gstPercent ?? 18,
      message: `Delivery Charge: ₹${pincodeData.deliveryCharge}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;