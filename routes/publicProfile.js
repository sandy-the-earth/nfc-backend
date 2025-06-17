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
    
    // Initialize views array if it doesn't exist
    if (!profile.views) {
      profile.views = [];
    }
    
    profile.views.push({ date: new Date(), ip, userAgent });
    profile.lastViewedAt = new Date();
    await profile.save();

    // Always expose a single 'slug' field
    const slug = profile.customSlug || profile.activationCode;

    res.json({
      slug,
      bannerUrl: profile.bannerUrl || '',
      avatarUrl: profile.avatarUrl || '',
      name: profile.name || '',
      title: profile.title || '',
      subtitle: profile.subtitle || '',
      location: profile.location || '',
      tags: Array.isArray(profile.tags) ? profile.tags : [],
      phone: profile.phone || '',
      website: profile.website || '',
      email: profile.ownerEmail || '',
      socialLinks: {
        instagram: profile.socialLinks?.instagram || '',
        linkedin: profile.socialLinks?.linkedin || '',
        twitter: profile.socialLinks?.twitter || ''
      },
      createdAt: profile.createdAt,
      exclusiveBadge: profile.exclusiveBadge || null,
      industry: profile.industry || '',
      theme: profile.theme || 'light'
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

    // Initialize linkClicks if it doesn't exist
    if (!profile.linkClicks) {
      profile.linkClicks = new Map();
    }

    // Ensure linkClicks is a Map
    if (!(profile.linkClicks instanceof Map)) {
      profile.linkClicks = new Map(Object.entries(profile.linkClicks));
    }

    // Increment link click count
    const currentCount = profile.linkClicks.get(link) || 0;
    profile.linkClicks.set(link, currentCount + 1);
    await profile.save();

    res.json({ 
      message: 'Link tap recorded', 
      link, 
      totalTaps: currentCount + 1,
      allTaps: Object.fromEntries(profile.linkClicks)
    });
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

    // Initialize contactExchanges if it doesn't exist
    if (typeof profile.contactExchanges !== 'number') {
      profile.contactExchanges = 0;
    }

    // Increment contact downloads
    profile.contactExchanges += 1;
    await profile.save();

    res.json({ 
      message: 'Contact download recorded', 
      totalDownloads: profile.contactExchanges 
    });
  } catch (err) {
    console.error('Error recording contact download:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;