const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    address: {
        type: String
    },
    transaction_details: {
        type: String
    },
    approved: {
        type: Boolean,
        default: false
    },
    membership_id: {
        type: String,
        unique: true,
        sparse: true
    },
    approval_date: {
        type: Date,
    },
    expiry_date: {
        type: Date
    }
});

module.exports = mongoose.model('Membership', MembershipSchema);
