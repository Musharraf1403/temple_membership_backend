const express = require('express');
const router = express.Router();
const mandalaabhishekamController = require('../controllers/mandalaabhishekamController');


// List all event registrations (with optional filters)
router.get('/registrations', mandalaabhishekamController.getRegistrations);

// Register for an event day (with payment)
router.post('/', mandalaabhishekamController.registerForEvent);

module.exports = router;
