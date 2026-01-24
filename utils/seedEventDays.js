const EventDay = require('../models/EventDay');

// 48 days for Mandalaabhishekam event (Feb 9 - Mar 28, 2026)
const eventDays = [
  { dayNumber: 1, date: '2026-02-09', star: 'Swathi', rasi: 'Tula', specialEvents: 'Mandalabhishekam Aarambham' },
  { dayNumber: 2, date: '2026-02-10', star: 'Visakha', rasi: 'Tula/Vrischika', specialEvents: '' },
  { dayNumber: 3, date: '2026-02-11', star: 'Anuradha', rasi: 'Vrischika', specialEvents: '' },
  { dayNumber: 4, date: '2026-02-12', star: 'Jyeshta', rasi: 'Vrischika', specialEvents: 'Thai Masam End' },
  { dayNumber: 5, date: '2026-02-13', star: 'Moola', rasi: 'Dhanu', specialEvents: 'Masi Masam Aarambham' },
  { dayNumber: 6, date: '2026-02-14', star: 'Poorvashada', rasi: 'Dhanu', specialEvents: 'Shani Pradosham' },
  { dayNumber: 7, date: '2026-02-15', star: 'Uttarashada', rasi: 'Dhanu/Makara', specialEvents: 'Maha Shivaratri' },
  { dayNumber: 8, date: '2026-02-16', star: 'Sravana', rasi: 'Makara', specialEvents: '' },
  { dayNumber: 9, date: '2026-02-17', star: 'Dhanishta', rasi: 'Makara/Kumbha', specialEvents: 'Amavasya' },
  { dayNumber: 10, date: '2026-02-18', star: 'Satabhisham', rasi: 'Kumbha', specialEvents: '' },
  { dayNumber: 11, date: '2026-02-19', star: 'Poorvabhadra', rasi: 'Kumbha/Meena', specialEvents: '' },
  { dayNumber: 12, date: '2026-02-20', star: 'Uttarabhadra', rasi: 'Meena', specialEvents: '' },
  { dayNumber: 13, date: '2026-02-21', star: 'Revathi', rasi: 'Meena', specialEvents: '' },
  { dayNumber: 14, date: '2026-02-22', star: 'Ashwini', rasi: 'Mesha', specialEvents: '' },
  { dayNumber: 15, date: '2026-02-23', star: 'Bharani', rasi: 'Mesha', specialEvents: '' },
  { dayNumber: 16, date: '2026-02-24', star: 'Kruthika', rasi: 'Mesha/Vrushabha', specialEvents: 'Krithigai / Kruthika' },
  { dayNumber: 17, date: '2026-02-25', star: 'Rohini', rasi: 'Vrushabha', specialEvents: '' },
  { dayNumber: 18, date: '2026-02-26', star: 'Mrigasira', rasi: 'Vrushabha/Mithuna', specialEvents: '' },
  { dayNumber: 19, date: '2026-02-27', star: 'Arudra', rasi: 'Mithuna', specialEvents: '' },
  { dayNumber: 20, date: '2026-02-28', star: 'Punarvasu', rasi: 'Mithuna/Karkataka', specialEvents: '' },
  { dayNumber: 21, date: '2026-03-01', star: 'Pushyami', rasi: 'Karkataka', specialEvents: 'Ravi Pradosham' },
  { dayNumber: 22, date: '2026-03-02', star: 'Ashlesha', rasi: 'Karkataka', specialEvents: '' },
  { dayNumber: 23, date: '2026-03-03', star: 'Makha', rasi: 'Simha', specialEvents: 'Pournami (Holi)' },
  { dayNumber: 24, date: '2026-03-04', star: 'Pubba (Purva Phalguni)', rasi: 'Simha', specialEvents: '' },
  { dayNumber: 25, date: '2026-03-05', star: 'Uttara (Uttara Phalguni)', rasi: 'Simha/Kanya', specialEvents: '' },
  { dayNumber: 26, date: '2026-03-06', star: 'Hasta', rasi: 'Kanya', specialEvents: '' },
  { dayNumber: 27, date: '2026-03-07', star: 'Chitta', rasi: 'Kanya/Tula', specialEvents: '' },
  { dayNumber: 28, date: '2026-03-08', star: 'Swathi', rasi: 'Tula', specialEvents: '' },
  { dayNumber: 29, date: '2026-03-09', star: 'Visakha', rasi: 'Tula/Vrischika', specialEvents: '' },
  { dayNumber: 30, date: '2026-03-10', star: 'Anuradha', rasi: 'Vrischika', specialEvents: '' },
  { dayNumber: 31, date: '2026-03-11', star: 'Jyeshta', rasi: 'Vrischika', specialEvents: '' },
  { dayNumber: 32, date: '2026-03-12', star: 'Moola', rasi: 'Dhanu', specialEvents: '' },
  { dayNumber: 33, date: '2026-03-13', star: 'Poorvashada', rasi: 'Dhanu', specialEvents: '' },
  { dayNumber: 34, date: '2026-03-14', star: 'Uttarashada', rasi: 'Dhanu/Makara', specialEvents: 'Masi Masam End' },
  { dayNumber: 35, date: '2026-03-15', star: 'Sravana', rasi: 'Makara', specialEvents: 'Panguni Masam Aarambham' },
  { dayNumber: 36, date: '2026-03-16', star: 'Dhanishta', rasi: 'Makara/Kumbha', specialEvents: 'Soma Pradosham' },
  { dayNumber: 37, date: '2026-03-17', star: 'Satabhisham', rasi: 'Kumbha', specialEvents: '' },
  { dayNumber: 38, date: '2026-03-18', star: 'Poorvabhadra', rasi: 'Kumbha/Meena', specialEvents: '' },
  { dayNumber: 39, date: '2026-03-19', star: 'Uttarabhadra', rasi: 'Meena', specialEvents: 'Amavasya' },
  { dayNumber: 40, date: '2026-03-20', star: 'Revathi', rasi: 'Meena', specialEvents: '' },
  { dayNumber: 41, date: '2026-03-21', star: 'Ashwini', rasi: 'Mesha', specialEvents: '' },
  { dayNumber: 42, date: '2026-03-22', star: 'Bharani', rasi: 'Mesha', specialEvents: '' },
  { dayNumber: 43, date: '2026-03-23', star: 'Kruthika', rasi: 'Mesha/Vrushabha', specialEvents: 'Krithigai / Kruthika' },
  { dayNumber: 44, date: '2026-03-24', star: 'Rohini', rasi: 'Vrushabha', specialEvents: '' },
  { dayNumber: 45, date: '2026-03-25', star: 'Mrigasira', rasi: 'Vrushabha/Mithuna', specialEvents: '' },
  { dayNumber: 46, date: '2026-03-26', star: 'Arudra', rasi: 'Mithuna', specialEvents: '' },
  { dayNumber: 47, date: '2026-03-27', star: 'Punarvasu', rasi: 'Mithuna/Karkataka', specialEvents: '' },
  { dayNumber: 48, date: '2026-03-28', star: 'Pushyami', rasi: 'Karkataka', specialEvents: 'Mandalabhishekam Poorthi' },
];

async function seedEventDays() {
  for (const day of eventDays) {
    await EventDay.findOneAndUpdate(
      { dayNumber: day.dayNumber },
      { ...day, date: new Date(day.date) },
      { upsert: true }
    );
  }
  console.log('Event days seeded!');
  process.exit();
}

seedEventDays();
