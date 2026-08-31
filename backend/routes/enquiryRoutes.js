const express = require('express');
const router = express.Router();
const {
  createEnquiry,
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} = require('../controllers/enquiryController');

// 🟢 Public: Form Submit Route
router.post('/', createEnquiry);

// 🟢 Admin: Fetch All Enquiries
router.get('/', getAllEnquiries);

// 🟢 Admin: Update Status (e.g., Pending -> Contacted)
router.put('/:id/status', updateEnquiryStatus);

// 🟢 Admin: Delete Enquiry
router.delete('/:id', deleteEnquiry);

module.exports = router;