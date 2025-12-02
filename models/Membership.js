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
    pincode: {
        type: String
    },
    function_date: {
        type: Date
    },
    address: {
        type: String
    },
    transaction_details: {
        type: String
    },
    payment_mode: {
        type: String
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
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
    },
    package_plan: {
        type: String
    },
    package_price: {
        type: Number
    },
    cancelled_sessions: [{
        type: String,
        default: []
    }]
});

module.exports = mongoose.model('Membership', MembershipSchema);
