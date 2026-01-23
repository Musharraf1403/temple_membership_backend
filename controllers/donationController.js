

const Donation = require('../models/Donation');
const Member = require('../models/Member');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);


// Create a new donation with Stripe payment
exports.createDonation = async (req, res) => {
  try {
    const { name, email, phone, amount, message } = req.body;
    if (!name || !email || !amount) {
      return res.status(400).json({ message: 'Name, email, and amount are required.' });
    }

    // Prepare Stripe Checkout session
    const unitAmount = Math.round(Number(amount) * 100);
    const currency = process.env.STRIPE_CURRENCY || 'usd';

    const priceData = {
      currency,
      product_data: { name: `Temple Donation` },
      unit_amount: unitAmount
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price_data: priceData, quantity: 1 }],
      customer_email: email,
      metadata: { name, email, phone, message },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/donation-cancel?session_id={CHECKOUT_SESSION_ID}`
    });

    // Find or create Member
    let member = await Member.findOne({ email, phone });
    if (!member) {
      member = new Member({ name, email, phone });
    } else {
      // Update member details if changed
      let updated = false;
      if (member.name !== name) { member.name = name; updated = true; }
      if (member.email !== email) { member.email = email; updated = true; }
      if (member.phone !== phone) { member.phone = phone; updated = true; }
      if (updated) await member.save();
    }
    await member.save();

    // Save the donation as pending (optional, or save after payment webhook)
    const donation = new Donation({ name, email, phone, amount, message, member: member._id });
    await donation.save();

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all donations
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ date: -1 });
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
