const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createMembership, updateMembership, deleteMembership, getAllMemberships, manageMembership } = require('../controllers/membershipController');

router.post('/', createMembership);
router.get('/', getAllMemberships);
router.put('/:id',auth, updateMembership);
router.delete('/:id', deleteMembership);
router.put('/:id/manage', manageMembership);


module.exports = router;
