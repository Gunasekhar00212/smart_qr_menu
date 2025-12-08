const express = require('express');
const cors = require('cors');
require('dotenv').config();

const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const tablesRoutes = require('./routes/tables');
const settingsRoutes = require('./routes/settings');
const staffRoutes = require('./routes/staff');
const feedbackRoutes = require('./routes/feedback');
const { sanitizeBody, rateLimit } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 5175;

// Middleware
app.use(cors());
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
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
});
