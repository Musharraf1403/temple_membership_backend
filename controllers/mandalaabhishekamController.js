const EventRegistration = require('../models/EventRegistration');
const Member = require('../models/Member');
const sendEmail = require('../utils/sendEmail');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);
// Stripe webhook handler for Mandalaabhishekam event registration
exports.handleMandalaabhishekamWebhook = (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET_FOR_MANDALAABHISHEKAM
        );
    } catch (err) {
        console.error('Mandalaabhishekam Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    res.status(200).json({ received: true });
    process.nextTick(async () => {
        if (event.type !== 'checkout.session.completed') return;
        try {
            const session = event.data.object;
            const { registrationId } = session.metadata || {};
            if (!registrationId) return;
            const registration = await EventRegistration.findById(registrationId).populate('member');
            if (!registration) {
                console.error('EventRegistration not found for ID:', registrationId);
                return;
            }
            registration.payment_status = 'Completed';
            registration.payment_mode = 'card';
            registration.transaction_details = JSON.stringify({
                session: session.id,
                payment_intent: session.payment_intent || null,
            });
            await registration.save();
            // Send confirmation email
            if (registration.member && registration.member.email) {
                const subject = 'Mandala abhishekam Registration Confirmed';
                const text = `Dear ${registration.member.name},\n\nYour registration for Mandalaabhishekam on ${registration.date} is confirmed.\n\nDetails:\nDate: ${registration.date}\nRasi: ${registration.rasi}\nStar: ${registration.star}\nSpecial Event: ${registration.specialEvent || 'No Special Event'}\nAmount: £${registration.amount}\n\nTransaction ID: ${session.id}\n\nThank you for your participation!\n\nLiverpool Murugan Temple`;
                try {
                    await sendEmail(registration.member.email, subject, text);
                } catch (emailErr) {
                    console.error('Mandala abhishekam confirmation email failed:', emailErr.message);
                }
            }
        } catch (err) {
            console.error('Async Mandala abhishekam webhook processing failed:', err);
        }
    });
};

// Only registration endpoint needed
exports.registerForEvent = async (req, res) => {
    try {
        const { name, email, phone, address, amount, date, rasi, star, specialEvent } = req.body;
        if (!name || !email || !phone || !address || !amount || !date || !rasi || !star) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        // Find or create member
        let member = await Member.findOne({ email, phone });
        if (!member) {
            member = new Member({ name, email, phone, address });
        } else {
            let updated = false;
            if (member.name !== name) { member.name = name; updated = true; }
            if (member.address !== address) { member.address = address; updated = true; }
            if (updated) await member.save();
        }
        await member.save();
        // Create registration (pending)
        const registration = new EventRegistration({
            member: member._id,
            amount,
            payment_status: 'Pending',
            date,
            rasi,
            star,
            specialEvent
        });
        await registration.save();
        // Stripe payment
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: process.env.STRIPE_CURRENCY || 'gbp',
                    product_data: { name: `Mandalaabhishekam Registration - ${date}` },
                    unit_amount: Math.round(Number(amount) * 100)
                },
                quantity: 1
            }],
            customer_email: email,
            metadata: {
                registrationId: registration._id.toString(),
                memberId: member._id.toString()
            },
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/mandalaabhishekam-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/mandalaabhishekam-cancel?registration_id=${registration._id.toString()}&session_id={CHECKOUT_SESSION_ID}`
        });
        res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

// Get all event registrations (optionally filter by payment_status, date, rasi, star)
exports.getRegistrations = async (req, res) => {
    try {
        const { payment_status, date, rasi, star } = req.query;
        const filter = {};
        if (payment_status) filter.payment_status = payment_status;
        if (date) filter.date = date;
        if (rasi) filter.rasi = rasi;
        if (star) filter.star = star;
        const regs = await EventRegistration.find(filter).populate('member').sort({ date: 1 });
        res.json(regs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching registrations', error: err.message });
    }
};
