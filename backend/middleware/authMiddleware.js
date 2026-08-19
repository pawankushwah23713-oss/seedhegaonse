const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🟢 1. Protect Middleware (Database check ke sath)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      
      // DB se user fetch karke req.user me attach karein
      req.user = await User.findById(decoded.id || decoded._id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found!' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// 🟢 2. Simple Verify Token Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded; // Contains id / _id
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// 🟢 3. Admin Only Middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Admin access required!' });
  }
};

module.exports = { protect, adminOnly, verifyToken };