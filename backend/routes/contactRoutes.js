const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact'); // Model Import

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // अगर Gmail यूज़ कर रहे हैं
  auth: {
    user: process.env.EMAIL_USER, // आपकी ईमेल ID
    pass: process.env.EMAIL_PASS, // Gmail का 16-digit App Password
  },
});

// POST Route: /api/contact
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // 1. Basic Validation
  if (!name || !email || !phone || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please fill all fields.',
    });
  }

  try {
    // 2. Database में Save करें
    const newContact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
    });
    await newContact.save();

    // 3. Admin को भेजने के लिए Email Template
    const adminMailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || 'info@seedhegaonse.in',
      replyTo: email,
      subject: `New Inquiry: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #871a1a;">New Contact Inquiry Received</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f9f9f9; padding: 12px; border-left: 4px solid #871a1a;">${message}</p>
        </div>
      `,
    };

    // 4. User को Confirmation Auto-Reply (Optional)
    const userMailOptions = {
      from: `"Seedhe Gaon Se" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We have received your message: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3 style="color: #871a1a;">Hello ${name},</h3>
          <p>Thank you for contacting <strong>Seedhe Gaon Se</strong>.</p>
          <p>We have received your query regarding <em>"${subject}"</em> and our team will get back to you shortly.</p>
          <br/>
          <p>Warm Regards,</p>
          <p><strong>Customer Support Team</strong></p>
          <p>📞 +91 9315911105 | Timings: 9:00 AM – 9:00 PM</p>
        </div>
      `,
    };

    // 5. Emails Send करें
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully!',
    });
  } catch (error) {
    console.error('Contact Form Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message,
    });
  }
});

// GET Route (Optional): Admin panel के लिए सारे messages fetch करने हेतु
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;