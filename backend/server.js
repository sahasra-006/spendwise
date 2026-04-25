require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ── Connect to MongoDB ──
connectDB();

const app = express();

// ── CORS: Allow React frontend ──
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternate
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Body parsing ──
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logger (dev only) ──
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health check endpoint ──
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Spendwise API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// ── 404 handler for unknown routes ──
app.use(notFound);

// ── Global error handler (must be last middleware) ──
app.use(errorHandler);

// ── Start server ──
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Spendwise API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 http://localhost:${PORT}/api/health\n`);
});

// ── Graceful shutdown ──
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

module.exports = app;
