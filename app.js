require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const membershipRoutes = require('./routes/membership');
const cors = require('cors');

const app = express();

// Connect Database
connectDB();

// Webhook route needs raw body - mount before JSON body parser
const membershipController = require('./controllers/membershipController');
app.post('/api/membership/webhook', express.raw({ type: 'application/json' }), membershipController.handleStripeWebhook);

// Init Middleware
app.use(bodyParser.json());

app.use(cors());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
