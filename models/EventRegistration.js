const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  amount: { type: Number, required: true, default: 101 },
  payment_status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  payment_mode: { type: String },
  transaction_details: { type: String },
  date: { type: String, required: true }, // event date as string (from frontend)
  rasi: { type: String, required: true },
  star: { type: String, required: true },
  specialEvent: { type: String }
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);