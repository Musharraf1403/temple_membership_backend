const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  message: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  payment_mode: {
    type: String
  },
  transaction_details: {
    type: String
  }
});

module.exports = mongoose.model('Donation', DonationSchema);
