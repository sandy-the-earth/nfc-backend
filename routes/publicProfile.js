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
    console.log(`Updated views count: ${profile.views.length}, lastViewedAt: ${profile.lastViewedAt}`); // Log updates
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
    if (profile.linkClicks && Object.keys(profile.linkClicks).length > 0) {
      let max = 0;
      for (const [method, count] of Object.entries(profile.linkClicks)) {
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

// Ensure proper handling of linkTaps and other params
router.post('/:activationCode/link-tap', async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ message: 'Link is required' });
    }

    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Increment link click count
    if (!profile.linkClicks) {
      profile.linkClicks = {}; // Initialize as plain object
    }
    const currentCount = profile.linkClicks[link] || 0;
    profile.linkClicks[link] = currentCount + 1;
    console.log(`Link tapped: ${link}, Total taps: ${currentCount + 1}`); // Log updates

    await profile.save();

    res.json({ message: 'Link tap recorded', link, totalTaps: currentCount + 1 });
  } catch (err) {
    console.error('Error recording link tap:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:activationCode/contact-download', async (req, res) => {
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

    // Increment contact downloads
    profile.contactExchanges = (profile.contactExchanges || 0) + 1;
    console.log(`Contact downloads incremented: ${profile.contactExchanges}`); // Log updates

    await profile.save();

    res.json({ message: 'Contact download recorded', totalDownloads: profile.contactExchanges });
  } catch (err) {
    console.error('Error recording contact download:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;