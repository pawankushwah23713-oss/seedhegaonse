// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const upload = require('../middleware/uploadMiddleware'); // 🟢 Avatar Upload Middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ── 1. REGISTER USER (/api/auth/register) ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ message: 'User with this Email already exists.' });
    }

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(400).json({ message: 'User with this Mobile Number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name.trim();
    const lastName = nameParts.slice(1).join(' ') || '';

    // By default role 'user' rahega
    const newUser = await User.create({
      name: name.trim(),
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: 'user',
      avatar: ''
    });

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ── 2. LOGIN USER (/api/auth/login) ──
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find User by Email OR Phone
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { phone: identifier.trim() }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid Email/Mobile Number or Password!' });
    }

    // Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid Email/Mobile Number or Password!' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || '',
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ── 3. GET CURRENT USER PROFILE (/api/auth/me) ──
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found!' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ── 4. 🟢 UPDATE USER PROFILE (Avatar, Name, Phone, Password, Address) (/api/auth/profile) ──
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      newPassword,
      // 🟢 Address fields — sent either from Profile page or from the
      // Cart's "Save this address to my profile" checkbox
      address,
      landmark,
      addressType,
      city,
      state,
      pincode,
      country
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Check unique email if changed
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ message: 'This Email is already in use by another account.' });
      }
      user.email = email.toLowerCase().trim();
    }

    // Check unique phone if changed
    if (phone && phone.trim() !== user.phone) {
      const phoneExists = await User.findOne({ phone: phone.trim() });
      if (phoneExists) {
        return res.status(400).json({ message: 'This Phone number is already in use by another account.' });
      }
      user.phone = phone.trim();
    }

    // Update Name
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;

    // 🟢 Update Saved Address (only touch fields that were actually sent,
    // so a partial update from the Cart drawer never wipes other fields)
    if (address !== undefined) user.address = address.trim();
    if (landmark !== undefined) user.landmark = landmark.trim();
    if (addressType !== undefined) user.addressType = addressType.trim();
    if (city !== undefined) user.city = city.trim();
    if (state !== undefined) user.state = state.trim();
    if (pincode !== undefined) user.pincode = pincode.trim();
    if (country !== undefined) user.country = country.trim();

    // 🟢 Update Avatar File if Uploaded
    if (req.file) {
      // Purani avatar image server storage se delete karo
      if (user.avatar && user.avatar.startsWith('/uploads')) {
        const oldImagePath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      user.avatar = `/uploads/products/${req.file.filename}`;
    }

    // 🟢 Update Password if Provided
    if (newPassword && newPassword.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword.trim(), salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: '🎉 Profile updated successfully!',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar || '',
        role: updatedUser.role,
        address: updatedUser.address || '',
        landmark: updatedUser.landmark || '',
        addressType: updatedUser.addressType || 'Permanent',
        city: updatedUser.city || '',
        state: updatedUser.state || '',
        pincode: updatedUser.pincode || '',
        country: updatedUser.country || 'India'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed: ' + error.message });
  }
});

// ── 5. 🟢 DELETE ACCOUNT (/api/auth/profile) ──
router.delete('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Delete avatar image from storage if exists
    if (user.avatar && user.avatar.startsWith('/uploads')) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ message: '🗑️ Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account: ' + error.message });
  }
});

// ── 6. ADMIN ONLY TEST ROUTE (/api/auth/admin-data) ──
router.get('/admin-data', protect, adminOnly, async (req, res) => {
  res.status(200).json({ message: 'Welcome to the Admin Protected Route!' });
});

module.exports = router;