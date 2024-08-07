const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createMembership, updateMembership, deleteMembership, getAllMemberships, manageMembership, getBlockedDates } = require('../controllers/membershipController');

router.post('/', createMembership);
router.get('/', auth, getAllMemberships);
router.put('/:id',auth, updateMembership);
router.delete('/:id', auth, deleteMembership);
router.put('/:id/manage', auth, manageMembership);
router.get('/getBlockedDates', getBlockedDates);


module.exports = router;
