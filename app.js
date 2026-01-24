require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const membershipRoutes = require('./routes/membership');
const cors = require('cors');


const donationRoutes = require('./routes/donation');
const mandalaabhishekamRoutes = require('./routes/mandalaabhishekam');
const sessionRoutes = require('./routes/session');

const app = express();

// Connect Database
connectDB();

// Webhook route needs raw body - mount before JSON body parser
const membershipController = require('./controllers/membershipController');
app.post('/api/membership/webhook', express.raw({ type: 'application/json' }), membershipController.handleStripeWebhook);
const donationController = require('./controllers/donationController');
app.post('/api/donations/webhook', express.raw({ type: 'application/json' }), donationController.handleStripeDonationWebhook);
const mandalaabhishekamController = require('./controllers/mandalaabhishekamController');
app.post('/api/mandalaabhishekam/webhook', express.raw({ type: 'application/json' }), mandalaabhishekamController.handleMandalaabhishekamWebhook);

// Init Middleware
app.use(bodyParser.json());

app.use(cors());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/mandalaabhishekam', mandalaabhishekamRoutes);
app.use('/api/session', sessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
