const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Path check kar lein (models/User.js)

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Authorization token missing or invalid. Please login.' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_123';
    
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      return res.status(401).json({ message: 'Token has expired or is invalid. Please login again.' });
    }

    req.user = await User.findById(decoded.id || decoded._id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User account not found.' });
    }

    next();
  } catch (error) {
    console.error('Auth Protect Error:', error);
    return res.status(401).json({ message: 'Authentication failed: ' + error.message });
  }
};

const adminOnly = (req, res, next) => {
  try {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied: Admin permissions required.' });
  } catch (error) {
    console.error('Admin Check Error:', error);
    return res.status(403).json({ message: 'Admin validation error: ' + error.message });
  }
};

module.exports = { protect, adminOnly };