const mongoose = require('mongoose');

const EventDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  date: { type: Date, required: true },
  star: { type: String, required: true },
  rasi: { type: String, required: true },
  specialEvents: { type: String },
});

module.exports = mongoose.model('EventDay', EventDaySchema);