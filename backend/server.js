const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const tablesRoutes = require('./routes/tables');
const settingsRoutes = require('./routes/settings');
const staffRoutes = require('./routes/staff');
const feedbackRoutes = require('./routes/feedback');
const serviceRequestsRoutes = require('./routes/service-requests');
const { sanitizeBody, rateLimit } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Middleware
// CORS configuration - allow requests from frontend
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply sanitization to all requests
app.use(sanitizeBody);

// Apply rate limiting to all routes
app.use(rateLimit(200, 60000)); // 200 requests per minute

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Menu AI Backend is running!' });
});

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/service-requests', serviceRequestsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Smart Menu AI Backend Server`);
  console.log(`📍 Running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${FRONTEND_URL || 'ALL ORIGINS (⚠️  Set FRONTEND_URL in production!)'}`);
  console.log(`🏥 Health check: /api/health\n`);
});
