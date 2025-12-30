const Membership = require('../models/Membership');
const sendEmail = require('../utils/sendEmail');
const _ = require('lodash');
const { PDFDocument, rgb } = require('pdf-lib');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);
exports.createMembership = async (req, res) => {
    try {
        console.log('STRIPE_SECRET present:', !!process.env.STRIPE_SECRET);
        const { name, phone, email, address, function_date, pincode, package_plan, package_price } = req.body;
        let existing = await Membership.findOne({ $or: [{ phone }, { email }] });
        if (existing) return res.status(400).json({ message: 'Member with same email or phone number already exists!' });

        // Save member first
        const membersCount = await Membership.countDocuments();
        const membership = new Membership({
            name,
            phone,
            email,
            address,
            membership_id: String(membersCount + 1),
            function_date,
            pincode,
            package_plan,
            package_price
        });
        await membership.save();
        console.log(package_price, 'package_price');
        // Prepare Stripe Checkout session
        const unitAmount = Math.round((package_price || 0) * 100);
        const currency = process.env.STRIPE_CURRENCY || 'usd';

        const priceData = {
            currency,
            product_data: { name: `Temple Membership (${package_plan || 'one-time'})` },
            unit_amount: unitAmount
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{ price_data: priceData, quantity: 1 }],
            customer_email: email,
            metadata: { membershipId: membership._id.toString(), package_plan: package_plan || '' },
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment-cancel?membership_id=${membership._id.toString()}&session_id={CHECKOUT_SESSION_ID}`
        });

        return res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('createMembership error:', error);
        return res.status(500).json({ message: error.message || String(error) });
    }
}

exports.updateMembership = async (req, res) => {
    try {
        let member = await Membership.findOne({ _id: req.params.id });
        if (!member) return res.status(400).json({ message: 'Member not found!' });

        let approveMessage = `Dear ${member.name},\n\nAttached is your membership ID card!.\n`;
        let cancelMessage = `Dear ${member.name},\n\nYour Membership got cancelled!.\n`;

        if (member.approved != req.body.approved) {
            if (req.body.approved) {
                member.approval_date = new Date();
                member.expiry_date = new Date(new Date().setDate(new Date().getDate() + 365));
                let idCard = await generateMembershipIdCard(member);
                let attachments = [{ filename: 'Membership_ID_Card.pdf', content: Buffer.from(idCard), contentType: 'application/pdf' }];
                await sendEmail(member.email, 'Your Membership ID card', approveMessage, attachments);
            } else {
                member.expiry_date = new Date();
                await sendEmail(member.email, 'Membership Cancelled!', cancelMessage);
            }
        }

        member.name = req.body.name;
        member.email = req.body.email;
        member.address = req.body.address;
        member.phone = req.body.phone;
        member.transaction_details = req.body.transaction_details;
        member.payment_mode = req.body.payment_mode;
        member.approved = req.body.approved;
        member.function_date = req.body.function_date;
        member.pincode = req.body.pincode;
        member.package_plan = req.body.package_plan;
        member.package_price = req.body.package_price;

        await member.save();
        return res.status(200).json({ message: req.body.approved ? 'Membership approved!' : 'Membership cancelled!' });
    } catch (error) {
        return res.status(500).json({ message: error.message || String(error) });
    }
}

exports.manageMembership = async (req, res) => {
    try {
        let member = await Membership.findOne({ _id: req.params.id });
        if (!member) return res.status(400).json({ message: 'Member not found!' });

        member.approved = req.body.approved;
        let approveMessage = `Dear ${member.name},\n\nAttached is your membership ID card!.\n`;
        let cancelMessage = `Dear ${member.name},\n\nYour Membership got cancelled!.\n`;
        if (req.body.approved) {
            member.approval_date = new Date();
            if (member.package_plan === 'yearly') member.expiry_date = new Date(new Date().setDate(new Date().getDate() + 365));
            else member.expiry_date = new Date(new Date().setDate(new Date().getDate() + 30));
            member.payment_mode = req.body.payment_mode;
            member.transaction_details = req.body.transaction_details;
            let idCard = await generateMembershipIdCard(member);
            let attachments = [{ filename: 'Membership_ID_Card.pdf', content: Buffer.from(idCard), contentType: 'application/pdf' }];
            await sendEmail(member.email, 'Your Membership ID card', approveMessage, attachments);
        } else {
            member.expiry_date = new Date();
            await sendEmail(member.email, 'Membership Cancelled!', cancelMessage);
        }

        await member.save();
        return res.status(200).json({ message: req.body.approved ? 'Membership approved!' : 'Membership cancelled!' });
    } catch (error) {
        return res.status(500).json({ message: error.message || String(error) });
    }
}

exports.getAllMemberships = async (req, res) => {
    console.log("Received request to get all memberships");
    try {
        let members = await Membership.find().lean();
        return res.status(200).json(members);
    } catch (error) {
        console.error("Error occurred while fetching members:", error);
        res.status(500).json({ message: error.message });
    }
}

exports.deleteMembership = async (req, res) => {
    try {
        let id = req.params.id;
        let members = await Membership.deleteOne({ _id: id });
        if (members)
            return res.status(200).json({ message: "Member removed Successfully!" });
        console.log("Member deleted!");
        return res.status(500).json({ message: "Member not found!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getBlockedDates = async (req, res) => {
    try {
        let dates = await Membership.find({ function_date: { $nin: [null] } }, { function_date: 1 }).lean();
        if (dates && dates.length) {
            return res.status(200).json({ blocked_dates: _.map(dates, 'function_date') });
        }
        return res.status(200).json({ blocked_dates: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get session and transaction details by Stripe session ID
exports.getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

        // Retrieve Stripe session
        const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent', 'customer'] });

        // Find membership by metadata
        const membershipId = session.metadata && session.metadata.membershipId;
        let memberData = null;
        if (membershipId) {
            memberData = await Membership.findById(membershipId).lean();
        }

        // Prepare transaction details response
        const transactionDetails = {
            sessionId: session.id,
            status: session.payment_status,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            customerEmail: session.customer_email,
            paymentIntent: session.payment_intent ? session.payment_intent.id : null,
            paymentStatus: session.payment_intent ? session.payment_intent.status : null,
            created: new Date(session.created * 1000).toISOString(),
            member: memberData ? {
                _id: memberData._id,
                name: memberData.name,
                email: memberData.email,
                membership_id: memberData.membership_id,
                approved: memberData.approved,
                payment_status: memberData.payment_status,
                approval_date: memberData.approval_date,
                expiry_date: memberData.expiry_date
            } : null
        };

        return res.status(200).json(transactionDetails);
    } catch (error) {
        console.error('getSessionDetails error:', error);
        return res.status(500).json({ message: error.message || String(error) });
    }
}

// Get pending membership by email or membershipId
exports.getPendingMembership = async (req, res) => {
    try {
        const { identifier } = req.params;
        if (!identifier) return res.status(400).json({ message: 'Email or Membership ID required' });

        let member;
        // Check if identifier is a MongoDB ObjectId or email
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            // It's a MongoDB ObjectId
            member = await Membership.findOne({ _id: identifier, approved: false }).lean();
        } else {
            // It's an email
            member = await Membership.findOne({ email: identifier, approved: false }).lean();
        }

        if (!member) return res.status(404).json({ message: 'No pending membership found' });

        return res.status(200).json({
            _id: member._id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            membership_id: member.membership_id,
            package_plan: member.package_plan,
            package_price: member.package_price,
            payment_status: member.payment_status,
            address: member.address,
            pincode: member.pincode,
            function_date: member.function_date
        });
    } catch (error) {
        console.error('getPendingMembership error:', error);
        return res.status(500).json({ message: error.message || String(error) });
    }
}

// Log cancelled Stripe session
exports.logCancelledSession = async (req, res) => {
    try {
        const { membershipId, sessionId } = req.body;
        if (!membershipId || !sessionId) return res.status(400).json({ message: 'Membership ID and Session ID required' });

        const member = await Membership.findById(membershipId);
        if (!member) return res.status(404).json({ message: 'Membership not found' });

        // Add cancelled session if not already logged
        if (!member.cancelled_sessions.includes(sessionId)) {
            member.cancelled_sessions.push(sessionId);
            await member.save();
        }

        return res.status(200).json({ message: 'Cancelled session logged', cancelled_count: member.cancelled_sessions.length });
    } catch (error) {
        console.error('logCancelledSession error:', error);
        return res.status(500).json({ message: error.message || String(error) });
    }
}

// Retry payment - generate new Checkout session for pending member
exports.retryPayment = async (req, res) => {
    try {
        const { membershipId } = req.params;
        if (!membershipId) return res.status(400).json({ message: 'Membership ID required' });

        const member = await Membership.findById(membershipId);
        if (!member) return res.status(404).json({ message: 'Membership not found' });
        if (member.approved) return res.status(400).json({ message: 'Membership already approved. Payment already completed.' });

        // Check for excessive cancelled sessions (more than 3 attempts)
        const cancelledCount = member.cancelled_sessions ? member.cancelled_sessions.length : 0;
        if (cancelledCount > 3) {
            return res.status(429).json({ message: 'Too many payment attempts cancelled. Please contact support.' });
        }

        // Create new Stripe Checkout session
        const unitAmount = Math.round((member.package_price || 0) * 100);
        const currency = process.env.STRIPE_CURRENCY || 'usd';

        const priceData = {
            currency,
            product_data: { name: `Temple Membership` },
            unit_amount: unitAmount
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{ price_data: priceData, quantity: 1 }],
            customer_email: member.email,
            metadata: { membershipId: member._id.toString(), package_plan: member.package_plan || '' },
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment-cancel?membership_id=${membershipId}&session_id={CHECKOUT_SESSION_ID}`
        });

        return res.status(200).json({ url: session.url, sessionId: session.id, retry_count: cancelledCount + 1 });
    } catch (error) {
        console.error('retryPayment error:', error);
        return res.status(500).json({ message: error.message || String(error) });
    }
}

// Stripe webhook handler
exports.handleStripeWebhook = (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ RESPOND IMMEDIATELY
    res.status(200).json({ received: true });

    // 🔥 DO ALL HEAVY WORK AFTER RESPONSE
    process.nextTick(async () => {
        if (event.type !== 'checkout.session.completed') return;

        try {
            const session = event.data.object;
            const membershipId = session.metadata?.membershipId;
            if (!membershipId) return;

            const full = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ['subscription', 'payment_intent'],
            });

            const member = await Membership.findById(membershipId);
            if (!member) return;

            member.payment_status = 'Completed';
            member.payment_mode = 'card';
            member.transaction_details = JSON.stringify({
                session: session.id,
                subscription: full.subscription?.id || null,
                payment_intent: full.payment_intent?.id || null,
            });
            member.approved = true;
            member.approval_date = new Date();

            member.expiry_date =
                member.package_plan === 'yearly'
                    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await member.save();

            // 🔹 Email (non-critical)
            try {
                const emailBody = `
Dear ${member.name},

We are pleased to inform you that your membership with Liverpool Murugan Temple has been successfully activated.
Your membership will remain valid until ${member.expiry_date}.

We sincerely thank you for your continued support and valued association with the temple.
Your contribution helps us uphold our spiritual, cultural, and community activities.
May Lord Murugan shower His divine blessings upon you and your family.

Yours sincerely,
Liverpool Murugan Temple
`;
                await sendEmail(
                    member.email,
                    'Liverpool Murugan Temple - Membership Payment Received',
                    emailBody
                );
            } catch (emailError) {
                console.error('Email failed (ignored):', emailError.message);
            }
        } catch (err) {
            console.error('Async webhook processing failed:', err);
        }
    });
};


const generateMembershipIdCard = async (member) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 200]);

    page.drawText('Membership ID Card', {
        x: 50,
        y: 150,
        size: 20,
        color: rgb(0, 0.53, 0.71),
    });

    page.drawText(`Name: ${member.name}`, {
        x: 50,
        y: 120,
        size: 15,
    });

    page.drawText(`Membership ID: ${member.membership_id}`, {
        x: 50,
        y: 100,
        size: 15,
    });

    page.drawText(`Join Date: ${new Date(member.approval_date).toLocaleDateString()}`, {
        x: 50,
        y: 80,
        size: 15,
    });

    page.drawText(`Expiry Date: ${new Date(member.expiry_date).toLocaleDateString()}`, {
        x: 50,
        y: 60,
        size: 15,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};

