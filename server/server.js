require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = async () => {
  const conn = require('./config/db');
  await conn();
  try {
    const { startFeeScheduler } = require('./utils/feeScheduler');
    startFeeScheduler();
  } catch (err) {
    console.error('Failed to start fee scheduler:', err);
  }
};

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const parcelRoutes = require('./routes/parcels');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Basic sanity check route
app.get('/', (req, res) => {
  res.send('GramPickup API is running...');
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Page Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // For Vercel Serverless execution
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
