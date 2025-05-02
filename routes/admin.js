// routes/admin.js
const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

// Helper function to generate random activation code
function generateActivationCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Admin creates an empty profile
router.post('/create-profile', async (req, res) => {
  try {
    let activationCode;
    let existing;

    // Keep generating until a unique code is found
    do {
      activationCode = generateActivationCode();
      existing = await Profile.findOne({ activationCode });
    } while (existing);

    const profile = new Profile({ activationCode });
    await profile.save();

    res.status(201).json({ message: 'Profile created successfully', activationCode: activationCode });
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;