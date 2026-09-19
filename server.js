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

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/auth', authRouter);   // 🆕 public auth routes
app.use('/notes', notesRouter); // 🔒 protected notes routes
app.use('/services', servicesRouter);
app.use('/contact', contactRouter);

// Root route (nice-to-have)
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});