const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

// GET public profile by activation code
router.get('/:activationCode', async (req, res) => {
  try {
    const p = await Profile.findOne({ activationCode: req.params.activationCode });
    if (!p) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Destructure your stored fields
    const {
      bannerUrl,
      avatarUrl,
      ownerName,     // if your schema uses ownerName for the person's name
      name,          // or name, whichever you use
      title,
      subtitle,
      bio,
      location,
      tags,
      phone,
      website,
      ownerEmail,
      socialLinks = {},  // should contain instagram, linkedin, twitter
      createdAt
    } = p;

    // Shape exactly what the UI needs
    res.json({
      bannerUrl,
      avatarUrl,
      name: ownerName || name,
      title,
      subtitle,
      bio,
      location,
      tags,
      phone,
      website,
      email: ownerEmail,            // normalized field
      socialLinks: {
        instagram: socialLinks.instagram,
        linkedin:  socialLinks.linkedin,
        twitter:   socialLinks.twitter
      },
      createdAt
    });
  } catch (err) {
    console.error('Public profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;