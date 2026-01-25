const Donation = require('../models/Donation');
const Member = require('../models/Member');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);
const sendEmail = require('../utils/sendEmail');


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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{ price_data: priceData, quantity: 1 }],
            customer_email: email,
            metadata: { memberId: member._id.toString() },
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200/'}payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200/'}payment-cancel?session_id={CHECKOUT_SESSION_ID}`
        });

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

            // Only update existing Donation, do not create Member
            const transaction_details = JSON.stringify({
                session: session.id,
                payment_intent: session.payment_intent || null,
            });
            // Try to find the donation by email, amount, and payment_status Pending
            let donation = await Donation.findOneAndUpdate(
                { email, amount, payment_status: 'Pending' },
                {
                    payment_status: 'Completed',
                    payment_mode: 'card',
                    transaction_details,
                    date: new Date()
                },
                { new: true }
            );
            if (!donation) {
                console.error('Donation not found for email:', email, 'amount:', amount);
                return;
            }

            // Send a thank you email to the donor
            if (email) {
                const subject = 'Thank you for your donation!';
                const text = `Dear ${donation.name || 'Donor'},\n\nThank you for your generous donation of $${amount} on ${new Date().toLocaleDateString()}.\n\nTransaction ID: ${session.id}\n\nYour support is greatly appreciated by Liverpool Murugan Temple.\n\nMay Lord Murugan bless you and your family.\n\nWith gratitude,\nLiverpool Murugan Temple`;
                try {
                    const mailResult = await sendEmail(email, subject, text);
                    if (!mailResult) {
                        console.error('Donation thank you email failed to send (sendEmail returned false)');
                    } else {
                        console.log('Donation thank you email sent to', email);
                    }
                } catch (emailErr) {
                    console.error('Donation thank you email failed:', emailErr.message);
                }
            }
        } catch (err) {
            console.error('Async donation webhook processing failed:', err);
        }
    });
};
