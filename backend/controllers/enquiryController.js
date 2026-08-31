const Enquiry = require('../models/Enquiry');
const nodemailer = require('nodemailer');

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Create new Bulk / Event Enquiry
// @route   POST /api/enquiry
// @access  Public
exports.createEnquiry = async (req, res) => {
  try {
    const { name, mobile, sweets, quantity, eventType, address } = req.body;

    // 1. Mandatory Fields Validation
    if (!name || !mobile || !quantity || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all mandatory (*) fields.',
      });
    }

    // 2. Mobile 10-Digit Validation
    if (!/^[0-9]{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.',
      });
    }

    // 3. Save to MongoDB
    const newEnquiry = new Enquiry({
      name: name.trim(),
      mobile: String(mobile).trim(),
      sweets: sweets ? sweets.trim() : 'Not Specified',
      quantity: quantity.trim(),
      eventType: eventType ? eventType.trim() : 'General',
      address: address.trim(),
    });

    const savedEnquiry = await newEnquiry.save();

    // 4. Socket.io Real-time Event Emit (Admin Dashboard ke liye)
    const io = req.app.get('io');
    if (io) {
      io.emit('new_enquiry', savedEnquiry);
      console.log('⚡ Socket.io: new_enquiry event emitted successfully');
    }

    // 5. Admin Email Template
    const adminMailOptions = {
      from: `"Seedhe Gaon Se" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || 'info@seedhegaonse.in',
      subject: `🍱 New Bulk Sweets Enquiry: ${name} (${quantity})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #871a1a; margin-top: 0;">New Bulk / Event Enquiry Received</h2>
          <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;" />
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Mobile Number:</strong> <a href="tel:${mobile}">${mobile}</a></p>
          <p><strong>Preferred Sweets:</strong> ${sweets || 'N/A'}</p>
          <p><strong>Estimated Quantity:</strong> ${quantity}</p>
          <p><strong>Type of Event:</strong> ${eventType || 'N/A'}</p>
          <p><strong>Delivery Address / Location:</strong></p>
          <p style="background: #fdf2f2; padding: 12px; border-left: 4px solid #871a1a; border-radius: 4px;">
            ${address}
          </p>
        </div>
      `,
    };

    // Send email in background (non-blocking)
    transporter.sendMail(adminMailOptions).catch((err) => {
      console.error('Nodemailer Error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! Our team will contact you soon.',
      data: savedEnquiry,
    });
  } catch (error) {
    console.error('Enquiry Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message,
    });
  }
};

// @desc    Get all enquiries (For Admin Panel)
// @route   GET /api/enquiry
// @access  Private / Admin
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch enquiries.',
      error: error.message,
    });
  }
};

// @desc    Update Enquiry Status (Pending, Contacted, Confirmed, Cancelled)
// @route   PUT /api/enquiry/:id/status
// @access  Private / Admin
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry status updated.',
      data: updatedEnquiry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update status.',
      error: error.message,
    });
  }
};

// @desc    Delete Enquiry
// @route   DELETE /api/enquiry/:id
// @access  Private / Admin
exports.deleteEnquiry = async (req, res) => {
  try {
    const deleted = await Enquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete enquiry.',
      error: error.message,
    });
  }
};