// routes/policyRoutes.js
const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// =========================================================
// 📋 1. GET ALL POLICIES (Admin — for the policy switcher dropdown)
// =========================================================
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const policies = await Policy.find().select('type title isActive updatedAt').sort({ type: 1 });
    return res.json({ success: true, policies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 🔍 2. GET ONE POLICY BY TYPE (PUBLIC — used by the actual policy page)
// =========================================================
router.get('/:type', async (req, res) => {
  try {
    const type = String(req.params.type).toLowerCase().trim();
    const policy = await Policy.findOne({ type, isActive: true }).lean();

    if (!policy) {
      return res.status(404).json({ success: false, message: `"${type}" policy not found.` });
    }

    // Sections sorted by their "order" field
    if (Array.isArray(policy.sections)) {
      policy.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return res.json({ success: true, policy });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// ➕ 3. CREATE OR UPDATE A POLICY (Admin Only, Upsert)
// =========================================================
router.put('/:type', protect, adminOnly, async (req, res) => {
  try {
    const type = String(req.params.type).toLowerCase().trim();
    const { title, intro, sections, footerNote, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const normalizedSections = Array.isArray(sections)
      ? sections.map((s, idx) => ({
          heading: s.heading || '',
          content: s.content || '',
          order: typeof s.order === 'number' ? s.order : idx
        }))
      : [];

    const updatedPolicy = await Policy.findOneAndUpdate(
      { type },
      {
        type,
        title: title.trim(),
        intro: intro || '',
        sections: normalizedSections,
        footerNote: footerNote || '',
        isActive: isActive !== undefined ? isActive : true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: `✅ "${updatedPolicy.title}" saved successfully!`,
      policy: updatedPolicy
    });
  } catch (err) {
    console.error('Policy save error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 🗑️ 4. DELETE A POLICY (Admin Only)
// =========================================================
router.delete('/:type', protect, adminOnly, async (req, res) => {
  try {
    const type = String(req.params.type).toLowerCase().trim();
    const deleted = await Policy.findOneAndDelete({ type });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Policy not found.' });
    }

    return res.json({ success: true, message: `🗑️ "${deleted.title}" deleted successfully!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// ⚡ 5. SEED DEFAULT SHIPPING POLICY (run once to migrate existing hardcoded content)
// =========================================================
router.post('/seed/shipping-default', protect, adminOnly, async (req, res) => {
  try {
    const defaultShippingPolicy = {
      type: 'shipping',
      title: 'Shipping Policy',
      intro:
        'At <strong>Seedhe Gaon Se</strong>, every order is freshly procured from our trusted village Halwai\'s. Since our products are perishable and prepared in small batches, we strive to dispatch all confirmed orders at the earliest to preserve their authentic taste and freshness.',
      sections: [
        {
          heading: 'Delivery coverage & timelines',
          content:
            'We currently offer delivery across <strong>Delhi NCR</strong> through our trusted delivery partners. Delivery timelines are indicative and may vary due to weather conditions, traffic, public holidays, operational constraints, or circumstances beyond our reasonable control. While we make every effort to ensure timely delivery, exact delivery times cannot be guaranteed.',
          order: 1
        },
        {
          heading: 'Address accuracy & customer responsibility',
          content:
            'Customers are requested to provide a complete and accurate delivery address, landmark, and contact number while placing the order. <strong>Seedhe Gaon Se</strong> shall not be responsible for delays, failed deliveries, or additional delivery charges arising from incorrect or incomplete address details, customer unavailability, or unreachable contact numbers.',
          order: 2
        },
        {
          heading: 'Ownership and risk',
          content:
            'Ownership and risk of the products pass to the customer upon successful delivery at the provided address. Customers are requested to inspect the outer packaging immediately upon delivery and report any visible damage or tampering without delay.',
          order: 3
        },
        {
          heading: 'Unsuccessful delivery attempts',
          content:
            "In case a delivery is unsuccessful due to customer absence, refusal to accept the parcel, incorrect address, or repeated unsuccessful delivery attempts, the order shall be treated as cancelled from the customer's end. As the products are freshly procured and highly perishable, shipping charges and other applicable costs shall not be refundable.",
          order: 4
        },
        {
          heading: 'Bulk & special event orders',
          content:
            'For bulk, corporate, festive, and wedding orders, delivery schedules are planned in advance. Customers are requested to ensure the availability of an authorised recipient at the delivery location. Any delay caused by the customer may affect product freshness, for which <strong>Seedhe Gaon Se</strong> shall not be held liable.',
          order: 5
        }
      ],
      footerNote:
        'We continuously work towards delivering authentic village sweets in the freshest possible condition and appreciate your understanding and cooperation in helping us maintain the highest quality standards.',
      isActive: true
    };

    const policy = await Policy.findOneAndUpdate(
      { type: 'shipping' },
      defaultShippingPolicy,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: '✅ Default Shipping Policy seeded successfully!',
      policy
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;