const Donation = require('../models/Donation');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);
const sendEmail = require('../utils/sendEmail');

// Stripe webhook handler for donations
exports.handleStripeDonationWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_FOR_DONATIONS
    );
  } catch (err) {
    console.error('Donation Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Respond immediately
  res.status(200).json({ received: true });

  // Process after response
  process.nextTick(async () => {
    if (event.type !== 'checkout.session.completed') return;
    try {
      const session = event.data.object;
      const { name, email, phone, message } = session.metadata || {};
      const amount = session.amount_total ? session.amount_total / 100 : 0;

      // Save or update donation as paid
      const transaction_details = JSON.stringify({
        session: session.id,
        payment_intent: session.payment_intent || null,
      });
      await Donation.create({
        name,
        email,
        phone,
        amount,
        message,
        date: new Date(),
        payment_status: 'Completed',
        payment_mode: 'card',
        transaction_details
      });

      // Send a thank you email to the donor
      if (email) {
        const subject = 'Thank you for your donation!';
        const text = `Dear ${name || 'Donor'},\n\nThank you for your generous donation of $${amount} on ${new Date().toLocaleDateString()}.\n\nTransaction ID: ${session.id}\n\nYour support is greatly appreciated by Liverpool Murugan Temple.\n\nMay Lord Murugan bless you and your family.\n\nWith gratitude,\nLiverpool Murugan Temple`;
        try {
          await sendEmail(email, subject, text);
        } catch (emailErr) {
          console.error('Donation thank you email failed:', emailErr.message);
        }
      }
    } catch (err) {
      console.error('Async donation webhook processing failed:', err);
    }
  });
};
