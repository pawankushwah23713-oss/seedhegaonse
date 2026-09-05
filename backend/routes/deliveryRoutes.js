const express = require('express');
const router = express.Router();
const DeliveryPincode = require('../models/DeliveryPincode');
const StoreSetting = require('../models/StoreSetting');

/* =========================================================
   🎁 1. STORE SETTINGS (Gift Box + Tax)
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
   📍 2. PINCODE ADMIN (Exact GST Saving with .lean())
   ========================================================= */
const handleSetPincode = async (req, res) => {
  try {
    const { pincodeInput, pincode, city, deliveryCharge, gstPercent, isServiceable } = req.body;

    const rawInput = pincodeInput || pincode;
    if (!rawInput || deliveryCharge === undefined || deliveryCharge === null) {
      return res.status(400).json({
        success: false,
        message: 'Pincode aur Delivery Charge dono required hain.'
      });
    }

    const pins = String(rawInput)
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);

    if (pins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kam se kam ek valid pincode daalein.'
      });
    }

    const chargeNum = Number(deliveryCharge);
    // ✅ Jo GST user ne bheja hai (e.g. 5, 12, 18, 0) wahi save hoga
    const gstNum = gstPercent !== undefined && gstPercent !== null && !isNaN(Number(gstPercent))
      ? Number(gstPercent)
      : 18;

    const serv = isServiceable !== undefined ? Boolean(isServiceable) : true;
    const cityStr = city ? String(city).trim() : '';

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

    return res.json({
      success: true,
      message: pins.length === 1
        ? `✅ Pincode ${pins[0]} (${gstNum}% GST) save ho gaya!`
        : `✅ Total ${pins.length} pincodes (${gstNum}% GST) save ho gaye!`
    });
  } catch (error) {
    console.error('handleSetPincode Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/', handleSetPincode);
router.post('/admin/set-pincode', handleSetPincode);

// 📋 GET All Pincodes (.lean() added so gstPercent is never omitted)
router.get('/admin/pincodes', async (req, res) => {
  try {
    const list = await DeliveryPincode.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✏️ UPDATE Single Pincode
router.put('/admin/pincode/:id', async (req, res) => {
  try {
    const { pincodeInput, pincode, city, deliveryCharge, gstPercent, isServiceable } = req.body;
    const entry = await DeliveryPincode.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Pincode nahi mila.' });
    }

    const pinVal = pincodeInput || pincode;
    if (pinVal !== undefined) entry.pincode = String(pinVal).trim();
    if (city !== undefined) entry.city = String(city).trim();
    if (deliveryCharge !== undefined) entry.deliveryCharge = Number(deliveryCharge) || 0;
    
    // ✅ Specific GST update
    if (gstPercent !== undefined && gstPercent !== null) {
      entry.gstPercent = Number(gstPercent);
    }
    
    if (isServiceable !== undefined) {
      entry.isServiceable = isServiceable === true || isServiceable === 'true';
    }

    await entry.save();
    res.json({ success: true, message: '✅ Pincode updated successfully!', data: entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Yeh pincode pehle se maujood hai.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔁 TOGGLE Serviceable
router.patch('/admin/pincode/:id/toggle', async (req, res) => {
  try {
    const entry = await DeliveryPincode.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Pincode nahi mila.' });
    }

    entry.isServiceable = !entry.isServiceable;
    await entry.save();

    res.json({
      success: true,
      message: entry.isServiceable ? '✅ Service ON ho gayi.' : '⛔ Service OFF ho gayi.',
      data: entry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🗑️ DELETE Pincode
router.delete('/admin/pincode/:id', async (req, res) => {
  try {
    const deleted = await DeliveryPincode.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Pincode nahi mila.' });
    }
    res.json({ success: true, message: '🗑️ Pincode successfully delete ho gaya!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 👤 USER CHECK Delivery Charge & GST
router.post('/check-delivery-charge', async (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode) {
      return res.status(400).json({ success: false, message: 'Pincode enter karein.' });
    }

    const pincodeData = await DeliveryPincode.findOne({ pincode: String(pincode).trim() }).lean();

    if (!pincodeData || !pincodeData.isServiceable) {
      return res.status(404).json({
        success: false,
        isServiceable: false,
        message: 'Sorry, is pincode par delivery uplabdh nahi hai.',
        deliveryCharge: 0
      });
    }

    res.json({
      success: true,
      isServiceable: true,
      city: pincodeData.city || '',
      deliveryCharge: pincodeData.deliveryCharge,
      gstPercent: pincodeData.gstPercent !== undefined ? pincodeData.gstPercent : 18,
      message: `Delivery Charge: ₹${pincodeData.deliveryCharge}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;