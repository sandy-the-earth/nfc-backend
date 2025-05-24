const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

// 🔹 GET public profile by activationCode OR customSlug
router.get('/:activationCode', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const {
      bannerUrl,
      avatarUrl,
      name,
      title,
      subtitle,
      location,
      tags,
      phone,
      website,
      ownerEmail,
      socialLinks = {},
      createdAt,
      customSlug,
      activationCode
    } = profile;

    // Always expose a single 'slug' field
    const slug = customSlug || activationCode;

    res.json({
      slug,
      bannerUrl,
      avatarUrl,
      name: name || '',
      title: title || '',
      subtitle: subtitle || '',
      location: location || '',
      tags: Array.isArray(tags) ? tags : [],
      phone: phone || '',
      website: website || '',
      email: ownerEmail || '',
      socialLinks: {
        instagram: socialLinks.instagram || '',
        linkedin: socialLinks.linkedin || '',
        twitter: socialLinks.twitter || ''
      },
      createdAt,
      exclusiveBadge: profile.exclusiveBadge || null
    });
  } catch (err) {
    console.error('❌ Public profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;