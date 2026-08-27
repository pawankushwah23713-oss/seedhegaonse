const express = require('express');
const router = express.Router();
const DeliveryPincode = require('../models/DeliveryPincode');

const handleSetPincode = async (req, res) => {
  try {
    const { pincode, deliveryCharge, isServiceable } = req.body;

    if (!pincode || deliveryCharge === undefined) {
      return res.status(400).json({ success: false, message: 'Pincode aur Delivery Charge zaroori hai' });
    }

    const result = await DeliveryPincode.findOneAndUpdate(
      { pincode: pincode.trim() },
      { deliveryCharge: Number(deliveryCharge), isServiceable: isServiceable !== undefined ? isServiceable : true },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Pincode delivery rate saved successfully!', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dono routes handle honge ab
router.post('/', handleSetPincode);
router.post('/admin/set-pincode', handleSetPincode);

// User API
router.post('/check-delivery-charge', async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({ success: false, message: 'Pincode enter karein' });
    }

    const pincodeData = await DeliveryPincode.findOne({ pincode: pincode.trim() });

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
      deliveryCharge: pincodeData.deliveryCharge,
      message: `Delivery Charge: ₹${pincodeData.deliveryCharge}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;