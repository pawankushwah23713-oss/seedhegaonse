const express = require('express');
const http = require('http'); // 🟢 Node.js HTTP module
const { Server } = require('socket.io'); // 🟢 Socket.io
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 🟢 Route Imports
const wishlistRoutes = require('./routes/wishlist');
const paymentRoutes = require('./routes/payment.routes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const contactRoutes = require('./routes/contactRoutes');
const couponRoutes = require('./routes/couponRoutes');
const giftRoutes = require('./routes/giftRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes'); 
const enquiryRoutes = require('./routes/enquiryRoutes');
const cakeRoutes = require('./routes/cakeRoutes');

const app = express();
const server = http.createServer(app); // 🟢 Create HTTP server

// 🟢 Socket.io with CORS Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible globally in all routes
app.set('io', io);

// Track Online Visitors
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('online_users_count', onlineUsers);
  console.log(`⚡ User connected: ${socket.id} (Total Online: ${onlineUsers})`);

  socket.on('disconnect', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    io.emit('online_users_count', onlineUsers);
    console.log(`🔌 User disconnected: ${socket.id} (Total Online: ${onlineUsers})`);
  });
});

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Static Serving
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

// ==========================================
// 🚀 API Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/orders', orderRoutes);        // Orders with Realtime Socket
app.use('/api/delivery', deliveryRoutes);   // Pincode delivery charges & GST
app.use('/api/coupons', couponRoutes);      // Single & Multi-use Coupons + Verify + Wallet
app.use('/api/gifts', giftRoutes);          // Free Gifts & Gift Tiers
app.use('/api/banners', bannerRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payment', paymentRoutes);     // Razorpay create-order + verify
app.use('/api/contact', contactRoutes);
app.use('/api/enquiry', enquiryRoutes);

// Optional: Agar aapne Couponwallet.routes.js alag rakha hai:
try {
  const couponWalletRoutes = require('./routes/Couponwallet.routes');
  app.use('/api/coupon-wallet', couponWalletRoutes);
} catch (e) {
  // Couponwallet route optional hai agar couponRoutes me already handle ho raha hai
}

// Default Health Route
app.get('/', (req, res) => {
  res.send('🌿 Seedhe Gaon Se API Server is running smoothly!');
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/seedhe_gaon_se';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Database');
    server.listen(PORT, () => console.log(`🚀 Realtime Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
  });