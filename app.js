require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const membershipRoutes = require('./routes/membership');
const cors = require('cors');

const donationRoutes = require('./routes/donation');

const app = express();

// Connect Database
connectDB();

// Webhook route needs raw body - mount before JSON body parser
const membershipController = require('./controllers/membershipController');
const donationWebhookController = require('./controllers/donationWebhookController');
app.post('/api/membership/webhook', express.raw({ type: 'application/json' }), membershipController.handleStripeWebhook);
app.post('/api/donations/webhook', express.raw({ type: 'application/json' }), donationWebhookController.handleStripeDonationWebhook);

// Init Middleware
app.use(bodyParser.json());

app.use(cors());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);

app.use('/api/donations', donationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
