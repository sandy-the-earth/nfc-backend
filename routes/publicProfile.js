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

    // Track view (increment views, update lastViewedAt)
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    profile.views.push({ date: new Date(), ip, userAgent });
    profile.lastViewedAt = new Date();
    await profile.save();

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

// GET /api/public/:activationCode/insights
router.get('/:activationCode/insights', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Calculate unique visitors (by ip+userAgent)
    const uniqueSet = new Set(profile.views.map(v => v.ip + '|' + v.userAgent));
    // Find most popular contact method
    let mostPopularContactMethod = null;
    if (profile.linkClicks && profile.linkClicks.size > 0) {
      let max = 0;
      for (const [method, count] of profile.linkClicks.entries()) {
        if (count > max) {
          max = count;
          mostPopularContactMethod = method;
        }
      }
    }
    res.json({
      totalViews: profile.views.length,
      uniqueVisitors: uniqueSet.size,
      contactExchanges: profile.contactExchanges || 0,
      lastViewedAt: profile.lastViewedAt,
      mostPopularContactMethod,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;