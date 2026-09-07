const express = require('express');
const router = express.Router();
const CorporateBulkOrders = require('../models/CorporateBulkOrders');

// Uses your existing middleware/authMiddleware.js
// `protect`   -> verifies JWT, fetches user from DB, attaches req.user
// `adminOnly` -> checks req.user.role === 'admin'
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Seed content — used ONLY the very first time (if no doc exists in DB yet)
const DEFAULT_POLICY = {
  title: 'Corporate & Bulk Orders',
  introText:
    "At **Seedhe Gaon Se**, we proudly cater to corporate gifting, weddings, festivals, family functions, and bulk celebrations with authentic traditional sweets sourced directly from renowned village Halwai's.",
  sections: [
    {
      heading: 'Advance booking & availability',
      content:
        'To ensure freshness and timely procurement, **bulk orders should preferably be placed at least 4–5 days in advance**. While we strive to accommodate urgent requests, acceptance of last-minute orders depends entirely on product availability and production capacity.',
      order: 1
    },
    {
      heading: 'Minimum order quantity & pricing',
      content:
        'A **minimum order quantity (MOQ)** may apply to avail bulk pricing and special discounts. Discounts are offered based on the order quantity, product selection, delivery location, and seasonal demand.',
      order: 2
    },
    {
      heading: 'Payment & cancellation terms',
      content:
        'For all corporate and bulk orders, **complete 100% advance payment is mandatory** to confirm the booking. Production and procurement commence only after the advance amount is received. Once the order enters the production or procurement stage, it cannot be cancelled, modified, or refunded.',
      order: 3
    },
    {
      heading: 'Product characteristics',
      content:
        'As our sweets are handcrafted using traditional methods and fresh ingredients, **minor variations in colour, texture, size, or weight are natural** and do not constitute a manufacturing defect.',
      order: 4
    },
    {
      heading: 'Delivery responsibilities',
      content:
        'The customer is responsible for providing accurate delivery details and ensuring the availability of the recipient at the time of delivery. Additional delivery attempts, address changes after dispatch, or special delivery requests may attract extra logistics charges.',
      order: 5
    },
    {
      heading: 'Branding & customization',
      content:
        'For personalised branding, customised gift boxes, printed sleeves, greeting cards, or corporate packaging, separate charges may apply and such customised orders are non-returnable and non-refundable.',
      order: 6
    }
  ],
  footerNote:
    'Our commitment is to make your special occasion memorable by delivering authentic, fresh, and premium-quality sweets crafted with care and tradition.'
};

// ============================================================
// GET /api/corporate-bulk-orders
// Public — used by the storefront policy page
// ============================================================
router.get('/', async (req, res) => {
  try {
    let policy = await CorporateBulkOrders.findOne();
    if (!policy) {
      policy = await CorporateBulkOrders.create(DEFAULT_POLICY);
    }
    res.json({ success: true, policy });
  } catch (err) {
    console.error('Corporate & bulk orders fetch error:', err);
    res.status(500).json({ success: false, message: 'Unable to load corporate & bulk orders policy.' });
  }
});

// ============================================================
// PUT /api/corporate-bulk-orders
// Admin only — update from the admin panel
// Body: { title, introText, sections: [{heading, content, order}], footerNote }
// ============================================================
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, introText, sections, footerNote } = req.body;

    if (!introText || !String(introText).trim()) {
      return res.status(400).json({ success: false, message: 'Intro text is required.' });
    }
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one section is required.' });
    }

    const cleanSections = sections
      .map((s, idx) => ({
        heading: String(s.heading || '').trim(),
        content: String(s.content || '').trim(),
        order: Number.isFinite(Number(s.order)) ? Number(s.order) : idx + 1
      }))
      .filter((s) => s.heading && s.content)
      .sort((a, b) => a.order - b.order);

    if (cleanSections.length === 0) {
      return res.status(400).json({ success: false, message: 'Sections must have a heading and content.' });
    }

    let policy = await CorporateBulkOrders.findOne();
    if (!policy) {
      policy = new CorporateBulkOrders();
    }

    policy.title = (title && String(title).trim()) || 'Corporate & Bulk Orders';
    policy.introText = String(introText).trim();
    policy.sections = cleanSections;
    policy.footerNote = footerNote ? String(footerNote).trim() : '';
    policy.updatedBy = req.user?._id;

    await policy.save();

    res.json({ success: true, message: '✅ Corporate & bulk orders policy updated successfully!', policy });
  } catch (err) {
    console.error('Corporate & bulk orders update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update corporate & bulk orders policy.' });
  }
});

module.exports = router;