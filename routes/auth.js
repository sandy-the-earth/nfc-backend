// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Profile = require('../models/Profile');

// User activates their profile
router.post('/activate-profile', async (req, res) => {
  try {
    const { activationCode, email, password } = req.body;

    // Validation
    if (!activationCode || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if activation code is valid
    const profile = await Profile.findOne({ activationCode });

    if (!profile) {
      return res.status(404).json({ message: 'Invalid activation code' });
    }

    if (profile.status === 'active') {
      return res.status(400).json({ message: 'This activation code has already been used' });
    }

    // Encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update profile
    profile.ownerEmail = email;
    profile.ownerPasswordHash = hashedPassword;
    profile.status = 'active';

    await profile.save();

    res.status(200).json({ message: 'Profile activated successfully' });
  } catch (err) {
    console.error('Error activating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;