const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// @route   POST /api/donations
// @desc    Create a new donation
router.post('/', donationController.createDonation);

// @route   GET /api/donations
// @desc    Get all donations
router.get('/', donationController.getDonations);

module.exports = router;
