const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Profile = require('../models/Profile');

// POST /api/auth/activate-profile
// Activates a profile using activation code, email, and password
router.post('/activate-profile', async (req, res) => {
  try {
    const { activationCode, email, password } = req.body;

    // 1. Required fields check
    if (!activationCode || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }

    // 3. Password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 4. Check activation code or custom slug
    const profile = await Profile.findOne({
      $or: [
        { activationCode },
        { customSlug: activationCode }
      ]
    });
    if (!profile) {
      return res.status(404).json({ message: 'Invalid activation code' });
    }

    // 5. Prevent re-activation
    if (profile.status === 'active') {
      return res.status(400).json({ message: 'This activation code has already been used' });
    }

    // 6. Check if email is already used in another profile
    const existingEmail = await Profile.findOne({ ownerEmail: email, status: 'active' });
    if (existingEmail) {
      return res.status(400).json({ message: 'This email is already in use by another profile' });
    }

    // 7. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 8. Update profile
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