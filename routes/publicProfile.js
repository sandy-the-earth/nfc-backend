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
    
    console.log(`[View] Profile: ${profile._id}, Views count: ${profile.views.length}, Last viewed: ${profile.lastViewedAt}`);
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
    console.log('[DEBUG] Insights request received:', {
      params: req.params,
      headers: req.headers
    });

    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });
    if (!profile) {
      console.log(`[DEBUG] Profile not found for code: ${req.params.activationCode}`);
      return res.status(404).json({ message: 'Profile not found' });
    }

    console.log(`[DEBUG] Profile found - ID: ${profile._id}`);
    console.log(`[DEBUG] Raw profile data:`, {
      views: profile.views?.length,
      linkClicks: profile.linkClicks,
      contactExchanges: profile.contactExchanges
    });

    // Calculate unique visitors (by ip+userAgent)
    const uniqueSet = new Set(profile.views.map(v => v.ip + '|' + v.userAgent));

    // Find most popular contact method
    let mostPopularContactMethod = null;
    if (profile.linkClicks) {
      const linkClicksObj = profile.linkClicks instanceof Map 
        ? Object.fromEntries(profile.linkClicks)
        : profile.linkClicks;

      let max = 0;
      for (const [method, count] of Object.entries(linkClicksObj)) {
        if (count > max) {
          max = count;
          mostPopularContactMethod = method;
        }
      }
    }

    const response = {
      totalViews: profile.views.length,
      uniqueVisitors: uniqueSet.size,
      contactExchanges: profile.contactExchanges || 0,
      lastViewedAt: profile.lastViewedAt,
      mostPopularContactMethod,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    console.log(`[DEBUG] Sending insights response:`, response);

    res.json(response);
  } catch (err) {
    console.error('[ERROR] Insights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ensure proper handling of linkTaps and other params
router.post('/:activationCode/link-tap', async (req, res) => {
  try {
    console.log('[DEBUG] Link tap request received:', {
      params: req.params,
      body: req.body,
      headers: req.headers
    });

    const { link } = req.body;
    if (!link) {
      console.log('[DEBUG] Link parameter missing in request body');
      return res.status(400).json({ message: 'Link is required' });
    }

    console.log(`[DEBUG] Attempting to record link tap for link: ${link}`);

    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });

    if (!profile) {
      console.log(`[DEBUG] Profile not found for code: ${req.params.activationCode}`);
      return res.status(404).json({ message: 'Profile not found' });
    }

    console.log(`[DEBUG] Before update - Profile ID: ${profile._id}`);
    console.log(`[DEBUG] Before update - LinkClicks:`, profile.linkClicks);

    // Initialize linkClicks if it doesn't exist
    if (!profile.linkClicks) {
      console.log(`[DEBUG] Initializing new linkClicks Map`);
      profile.linkClicks = new Map();
    }

    // Ensure linkClicks is a Map
    if (!(profile.linkClicks instanceof Map)) {
      console.log(`[DEBUG] Converting linkClicks to Map from:`, profile.linkClicks);
      profile.linkClicks = new Map(Object.entries(profile.linkClicks));
    }

    // Increment link click count
    const currentCount = profile.linkClicks.get(link) || 0;
    profile.linkClicks.set(link, currentCount + 1);
    
    console.log(`[DEBUG] After update - New count for ${link}: ${currentCount + 1}`);
    console.log(`[DEBUG] After update - All linkClicks:`, Object.fromEntries(profile.linkClicks));

    try {
      await profile.save();
      console.log(`[DEBUG] Profile saved successfully`);
    } catch (saveError) {
      console.error('[ERROR] Failed to save profile:', saveError);
      return res.status(500).json({ message: 'Failed to save profile update' });
    }

    res.json({ 
      message: 'Link tap recorded', 
      link, 
      totalTaps: currentCount + 1,
      allTaps: Object.fromEntries(profile.linkClicks)
    });
  } catch (err) {
    console.error('[ERROR] Error recording link tap:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:activationCode/contact-download', async (req, res) => {
  try {
    console.log('[DEBUG] Contact download request received:', {
      params: req.params,
      body: req.body,
      headers: req.headers
    });

    console.log(`[DEBUG] Attempting to record contact download`);

    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });

    if (!profile) {
      console.log(`[DEBUG] Profile not found for code: ${req.params.activationCode}`);
      return res.status(404).json({ message: 'Profile not found' });
    }

    console.log(`[DEBUG] Before update - Profile ID: ${profile._id}`);
    console.log(`[DEBUG] Before update - ContactExchanges: ${profile.contactExchanges}`);

    // Initialize contactExchanges if it doesn't exist
    if (typeof profile.contactExchanges !== 'number') {
      console.log(`[DEBUG] Initializing contactExchanges to 0`);
      profile.contactExchanges = 0;
    }

    // Increment contact downloads
    profile.contactExchanges += 1;
    console.log(`[DEBUG] After update - ContactExchanges: ${profile.contactExchanges}`);

    try {
      await profile.save();
      console.log(`[DEBUG] Profile saved successfully`);
    } catch (saveError) {
      console.error('[ERROR] Failed to save profile:', saveError);
      return res.status(500).json({ message: 'Failed to save profile update' });
    }

    res.json({ 
      message: 'Contact download recorded', 
      totalDownloads: profile.contactExchanges 
    });
  } catch (err) {
    console.error('[ERROR] Error recording contact download:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;