const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createMembership, updateMembership, deleteMembership, getAllMemberships, manageMembership, getBlockedDates, getPendingMembership, retryPayment, logCancelledSession } = require('../controllers/membershipController');

router.post('/', createMembership);
router.get('/', auth, getAllMemberships);
router.get('/pending/:identifier', getPendingMembership);
router.post('/retry/:membershipId', retryPayment);
router.post('/cancel-session', logCancelledSession);
router.put('/:id',auth, updateMembership);
router.delete('/:id', auth, deleteMembership);
router.put('/:id/manage', auth, manageMembership);
router.get('/getBlockedDates', getBlockedDates);


module.exports = router;
