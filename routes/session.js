const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Common session details endpoint
router.get('/:sessionId', sessionController.getSessionDetails);

module.exports = router;