// routes/login.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Profile = require('../models/Profile');

// POST /api/login
// Authenticates user with email and password
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check all fields
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Find profile by email
    const profile = await Profile.findOne({ ownerEmail: email });
    if (!profile) {
      return res.status(404).json({ message: 'No profile found with this email' });
    }

    // 3. Check profile is active
    if (profile.status !== 'active') {
      return res.status(400).json({ message: 'Profile is not activated' });
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, profile.ownerPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // 5. Login successful
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