const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Donation = require('../models/Donation');
const EventRegistration = require('../models/EventRegistration');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);

// Common getSessionDetails for Membership, Donation, and EventRegistration
exports.getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

        // Retrieve Stripe session
        const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent', 'customer'] });

        // Get memberId from session metadata
        const memberId = session.metadata && session.metadata.memberId;
        let member = null;
        let membership = null;
        let donation = null;
        let eventRegistration = null;

        if (memberId) {
            member = await Member.findById(memberId).lean();
            membership = await Membership.findOne({ member: memberId }).lean();
            donation = await Donation.findOne({ member: memberId }).lean();
            eventRegistration = await EventRegistration.findOne({ member: memberId }).lean();
        }

        const transactionDetails = {
            sessionId: session.id,
            status: session.payment_status,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            customerEmail: session.customer_email,
            paymentIntent: session.payment_intent ? session.payment_intent.id : null,
            paymentStatus: session.payment_intent ? session.payment_intent.status : null,
            created: new Date(session.created * 1000).toISOString(),
            member,
            membership,
            donation,
            eventRegistration
        };

        return res.status(200).json(transactionDetails);
    } catch (error) {
        console.error('getSessionDetails error:', error);
        return res.status(500).json({ message: error.message || String(error) });
    }
};
