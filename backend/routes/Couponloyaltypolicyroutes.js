const express = require('express');
const router = express.Router();
const CouponLoyaltyPolicy = require('../models/CouponLoyaltyPolicy');

// Uses your existing middleware/authMiddleware.js
// `protect`   -> verifies JWT, fetches user from DB, attaches req.user
// `adminOnly` -> checks req.user.role === 'admin'
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Seed content — used ONLY the very first time (if no doc exists in DB yet)
const DEFAULT_POLICY = {
  title: 'Coupon & Loyalty Policy',
  introText:
    'At **Seedhe Gaon Se**, we value every customer and may, at our sole discretion, offer promotional coupons, loyalty points, cash back offers, referral rewards, festive benefits or other promotional incentives from time to time. Such offers are intended solely to reward genuine customers and enhance their shopping experience.',
  sections: [
    {
      heading: '1. Nature of promotional benefits',
      content:
        'Coupons, loyalty points and rewards are promotional benefits with **no cash value**, **are non-transferable**, and cannot be exchanged for cash, refunded or combined with any other offer unless expressly stated. Unless otherwise specified, only **one coupon or promotional offer** may be redeemed per order.',
      order: 1
    },
    {
      heading: '2. Validity & usage conditions',
      content:
        'Each coupon, reward or loyalty benefit is subject to its own validity period, minimum order value, eligible products and other applicable terms. Expired, altered, duplicated or misused coupons shall be deemed invalid and will not be accepted under any circumstances.',
      order: 2
    },
    {
      heading: '3. Fraud prevention & account fairness',
      content:
        '**Seedhe Gaon Se** reserves the right to modify, suspend, reject or cancel any coupon, loyalty points or reward in cases of suspected fraud, misuse, duplicate accounts, technical errors or violation of these Terms & Conditions, without prior notice or liability.',
      order: 3
    },
    {
      heading: '4. Right of discontinuation',
      content:
        'The Company further reserves the absolute right to introduce, modify or discontinue any loyalty programme, reward scheme or promotional campaign at any time without assigning any reason. Participation in such programmes shall constitute acceptance of this Policy and the Company\u2019s decision regarding all promotional benefits shall be final and binding.',
      order: 4
    }
  ]
};

// ============================================================
// GET /api/coupon-loyalty-policy
// Public — used by the storefront policy page
// ============================================================
router.get('/', async (req, res) => {
  try {
    let policy = await CouponLoyaltyPolicy.findOne();
    if (!policy) {
      policy = await CouponLoyaltyPolicy.create(DEFAULT_POLICY);
    }
    res.json({ success: true, policy });
  } catch (err) {
    console.error('Coupon & loyalty policy fetch error:', err);
    res.status(500).json({ success: false, message: 'Unable to load coupon & loyalty policy.' });
  }
});

// ============================================================
// PUT /api/coupon-loyalty-policy
// Admin only — update from the admin panel
// Body: { title, introText, sections: [{heading, content, order}] }
// ============================================================
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, introText, sections } = req.body;

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

    let policy = await CouponLoyaltyPolicy.findOne();
    if (!policy) {
      policy = new CouponLoyaltyPolicy();
    }

    policy.title = (title && String(title).trim()) || 'Coupon & Loyalty Policy';
    policy.introText = String(introText).trim();
    policy.sections = cleanSections;
    policy.updatedBy = req.user?._id;

    await policy.save();

    res.json({ success: true, message: '✅ Coupon & Loyalty policy updated successfully!', policy });
  } catch (err) {
    console.error('Coupon & loyalty policy update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update coupon & loyalty policy.' });
  }
});

module.exports = router;