// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Folder auto-create agar exist na kare
const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Unique name: sweet-1718292828-8273648.png
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `sweet-${uniqueSuffix}${ext}`);
  }
});

// File Type Validation (.png, .jpeg, .jpg, .webp, .svg)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|svg|gif/;
  const isExtAllowed = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const isMimeAllowed = file.mimetype.startsWith('image/');

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (.png, .jpg, .jpeg, .webp, .svg) are allowed!'), false);
  }
};

// Multer Upload Instance (Max 5MB file limit)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
});

module.exports = upload;