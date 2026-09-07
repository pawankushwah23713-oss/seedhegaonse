const express = require('express');
const router = express.Router();
const CancellationPolicy = require('./models/CancellationPolicy');

// Uses your existing middleware/authMiddleware.js
// `protect`   -> verifies JWT, fetches user from DB, attaches req.user
// `adminOnly` -> checks req.user.role === 'admin'
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Seed content — used ONLY the very first time (if no doc exists in DB yet)
const DEFAULT_POLICY = {
  title: 'Cancellation Policy',
  introText:
    "At **Seedhe Gaon Se**, our products are highly perishable, prepared in small batches, and freshly procured from our trusted village Halwai's based on your order confirmation. Because procurement and preparation begin almost immediately, cancellations are subject to strict terms.",
  sections: [
    {
      heading: '1. Cancellation timeframe',
      content:
        'Customers can request an order cancellation **within 30 minutes** of placing the order or before the order status moves to "Processing" / "Dispatched" (whichever is earlier). Once procurement begins or the batch is packed, we cannot accept any cancellation requests.',
      order: 1
    },
    {
      heading: '2. How to request cancellation',
      content:
        'To request a cancellation within the permitted window, please contact our customer support team immediately via our designated helpline or support email with your active Order ID. Requests made outside business hours or through social media comments may not be processed in time.',
      order: 2
    },
    {
      heading: '3. Cancellations by Seedhe Gaon Se',
      content:
        'We reserve the right to cancel any order due to unforeseen circumstances, including but not limited to: non-availability of fresh stock from the Halwai, operational delivery constraints within your region in Delhi NCR, extreme weather conditions, or incorrect pricing/product details on the website. In such cases, a 100% refund will be initiated to your original payment mode.',
      order: 3
    },
    {
      heading: '4. Failed deliveries as cancellations',
      content:
        "If an order cannot be delivered due to customer absence, a wrong phone number, an incorrect address, or refusal to accept the package, the order will be marked as cancelled from the customer's end. Due to the perishable nature of our products, **no refunds** will be issued for such cases.",
      order: 4
    },
    {
      heading: '5. Refund processing for cancelled orders',
      content:
        'For valid cancellations approved by our support desk, the payment will be refunded to your original source account within **7–10 business days**, subject to standard bank processing guidelines.',
      order: 5
    }
  ],
  footerNote:
    'By confirming your order with Seedhe Gaon Se, you explicitly agree to follow this Cancellation Policy.'
};

// ============================================================
// GET /api/cancellation-policy
// Public — used by the storefront policy page
// ============================================================
router.get('/', async (req, res) => {
  try {
    let policy = await CancellationPolicy.findOne();
    if (!policy) {
      policy = await CancellationPolicy.create(DEFAULT_POLICY);
    }
    res.json({ success: true, policy });
  } catch (err) {
    console.error('Cancellation policy fetch error:', err);
    res.status(500).json({ success: false, message: 'Unable to load cancellation policy.' });
  }
});

// ============================================================
// PUT /api/cancellation-policy
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

    let policy = await CancellationPolicy.findOne();
    if (!policy) {
      policy = new CancellationPolicy();
    }

    policy.title = (title && String(title).trim()) || 'Cancellation Policy';
    policy.introText = String(introText).trim();
    policy.sections = cleanSections;
    policy.footerNote = footerNote ? String(footerNote).trim() : '';
    policy.updatedBy = req.user?._id;

    await policy.save();

    res.json({ success: true, message: '✅ Cancellation policy updated successfully!', policy });
  } catch (err) {
    console.error('Cancellation policy update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update cancellation policy.' });
  }
});

module.exports = router;