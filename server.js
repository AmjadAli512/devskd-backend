require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRouter = require('./routes/auth');
const notesRouter = require('./routes/notes');
const servicesRouter = require('./routes/services');
const contactRouter = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:3001',
  // Production origins (comma-separated in CLIENT_URL on Railway)
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
    : [])
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      // Exact match
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments for this project only
      if (/^https:\/\/devskd-web(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }

      console.warn(`🚫 CORS blocked: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check (for Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/auth', authRouter);
app.use('/notes', notesRouter);
app.use('/services', servicesRouter);
app.use('/contact', contactRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'DevSKD API. Use /auth/signup or /auth/login to get started.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});