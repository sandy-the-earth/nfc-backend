const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Profile = require('../models/Profile');

// POST /api/login
// Authenticates user with email and password
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // 3. Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 4. Look up profile
    const profile = await Profile.findOne({ ownerEmail: email });
    if (!profile) {
      return res.status(404).json({ message: 'No profile found with this email' });
    }

    // 5. Ensure profile is active
    if (profile.status !== 'active') {
      return res.status(400).json({ message: 'Profile is not activated yet' });
    }

    // 6. Compare password
    const isMatch = await bcrypt.compare(password, profile.ownerPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // 7. Success
    return res.status(200).json({
      message: 'Login successful',
      profileId: profile._id,
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;