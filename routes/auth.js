const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/email');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Helper: generate a JWT for a user
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Rate limit: max 3 forgot-password requests per IP per 15 minutes
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again in 15 minutes.' }
});

// Rate limit: max 10 reset-password attempts per IP per 15 minutes
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset attempts. Please try again in 15 minutes.' }
});

// ------------------------------------------------
// POST /auth/signup - Register a new user
// ------------------------------------------------
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 3. Hash password (bcryptjs: saltRounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user'
    });

    // 5. Generate JWT
    const token = generateToken(user._id, user.role);

    // 6. Respond (never send the password hash)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ------------------------------------------------
// POST /auth/login - Authenticate a user
// ------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Generic error to avoid leaking which field is wrong
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Generate JWT
    const token = generateToken(user._id, user.role);

    // 5. Respond
    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ------------------------------------------------
// POST /auth/forgot-password - Send a password reset link
// ------------------------------------------------
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const responseMessage = 'If that email exists, a reset link has been sent.';

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(200).json({ message: responseMessage });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      const resetUrl = `${process.env.CLIENT_URL_FRONTEND}/reset-password/${rawToken}`;
      const emailResult = await sendPasswordResetEmail(user.email, resetUrl);
      if (!emailResult.success) {
        console.error('Password reset email failed:', emailResult.error);
      }
    }

    return res.status(200).json({ message: responseMessage });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({ error: 'Server error during password reset request' });
  }
});

// ------------------------------------------------
// POST /auth/reset-password/:token - Reset a password
// ------------------------------------------------
router.post('/reset-password/:token', resetPasswordLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ error: 'Server error during password reset' });
  }
});

module.exports = router;