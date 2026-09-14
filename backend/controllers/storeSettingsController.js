const StoreSettings = require('../models/StoreSettings');

// Helper: Hamesha ek hi master settings document maintain karega
const fetchMasterSettings = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({
      codEnabled: true,
      upiEnabled: true,
      upiId: 'seedhegaonse@upi',
      giftBoxEnabled: true,
      giftBoxTitle: 'Gift Box Packaging',
      giftBoxCharge: 50,
      productTaxPercent: 5,
      shippingTaxPercent: 5
    });
  }
  return settings;
};

// @desc    Cart aur Checkout ke liye settings get karna
// @route   GET /api/delivery/settings
exports.fetchSettings = async (req, res) => {
  try {
    const settings = await fetchMasterSettings();

    return res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    console.error('Fetch Settings Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load settings',
      error: err.message
    });
  }
};

// @desc    Admin panel se COD, UPI, Tax etc. update/toggle karna
// @route   POST /api/delivery/settings  YA  PUT /api/delivery/settings
exports.saveSettings = async (req, res) => {
  try {
    const {
      codEnabled,
      upiEnabled,
      upiId,
      giftBoxEnabled,
      giftBoxTitle,
      giftBoxCharge,
      productTaxPercent,
      shippingTaxPercent,
      productGlobalCoupons,
      productGlobalGiftTiers
    } = req.body;

    let settings = await fetchMasterSettings();

    // COD aur UPI toggle
    if (codEnabled !== undefined) settings.codEnabled = Boolean(codEnabled);
    if (upiEnabled !== undefined) settings.upiEnabled = Boolean(upiEnabled);
    if (upiId !== undefined) settings.upiId = String(upiId).trim();

    // Gift Box
    if (giftBoxEnabled !== undefined) settings.giftBoxEnabled = Boolean(giftBoxEnabled);
    if (giftBoxTitle !== undefined) settings.giftBoxTitle = giftBoxTitle;
    if (giftBoxCharge !== undefined) settings.giftBoxCharge = Number(giftBoxCharge);

    // Tax
    if (productTaxPercent !== undefined) settings.productTaxPercent = Number(productTaxPercent);
    if (shippingTaxPercent !== undefined) settings.shippingTaxPercent = Number(shippingTaxPercent);

    // Offers & Coupons
    if (productGlobalCoupons !== undefined) settings.productGlobalCoupons = productGlobalCoupons;
    if (productGlobalGiftTiers !== undefined) settings.productGlobalGiftTiers = productGlobalGiftTiers;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully!',
      settings
    });
  } catch (err) {
    console.error('Save Settings Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: err.message
    });
  }
};