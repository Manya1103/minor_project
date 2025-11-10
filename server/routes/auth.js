const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  
  console.log('\n--- [DEBUG] /api/auth/register route HIT ---');

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('--- [DEBUG] Validation FAILED:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;
    console.log(`--- [DEBUG] Received data for: ${email}`);

    // Check if user exists
    console.log('--- [DEBUG] Step 1: Checking if user exists (await User.findOne)...');
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('--- [DEBUG] User ALREADY EXISTS');
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    console.log('--- [DEBUG] Step 1: ...User.findOne complete. User does not exist.');

    // Create user
    console.log('--- [DEBUG] Step 2: Creating new User object...');
    user = new User({ name, email, password });
    
    // This pre-save hook in models/User.js will run here
    console.log('--- [DEBUG] Step 3: Saving user (await user.save)... This will trigger password hashing.');
    await user.save();
    console.log('--- [DEBUG] Step 3: ...user.save complete. User saved to DB.');

    // Generate token
    console.log('--- [DEBUG] Step 4: Generating JWT (jwt.sign)...');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
    console.log('--- [DEBUG] Step 4: ...JWT generated.');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    console.log(`--- [DEBUG] SUCCESS: User ${email} registered and response sent.`);

  } catch (error) {
    // --- THIS IS THE MOST IMPORTANT PART ---
    console.error('======================================');
    console.error('!!! REGISTRATION FAILED - CATCH BLOCK HIT !!!');
    console.error('Time:', new Date().toISOString());
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Full Error Stack:', error.stack);
    console.error('======================================');
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// (The rest of your login and /me routes remain unchanged)
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;