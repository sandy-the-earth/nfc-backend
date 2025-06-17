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
      linkClicks: profile.linkClicks?.length,
      contactExchanges: profile.contactExchanges?.length
    });

    // Calculate unique visitors (by ip+userAgent)
    const uniqueSet = new Set(profile.views.map(v => v.ip + '|' + v.userAgent));

    // Calculate link clicks statistics
    let totalLinkTaps = 0;
    let topLink = null;
    let maxTaps = 0;
    let linkTapsOverTime = [];

    if (profile.linkClicks && profile.linkClicks.length > 0) {
      // Group clicks by link
      const linkGroups = profile.linkClicks.reduce((acc, click) => {
        acc[click.link] = (acc[click.link] || 0) + 1;
        return acc;
      }, {});

      // Find top link
      for (const [link, count] of Object.entries(linkGroups)) {
        totalLinkTaps += count;
        if (count > maxTaps) {
          maxTaps = count;
          topLink = link;
        }
      }

      // Create link taps over time data
      linkTapsOverTime = Object.entries(linkGroups)
        .map(([link, count]) => ({ link, count }))
        .sort((a, b) => b.count - a.count);
    }

    const response = {
      totalViews: profile.views.length,
      uniqueVisitors: uniqueSet.size,
      contactExchanges: profile.contactExchanges?.length || 0,
      lastViewedAt: profile.lastViewedAt,
      mostPopularContactMethod: topLink,
      totalLinkTaps,
      linkTapsOverTime,
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

    // Initialize linkClicks as an array of objects, similar to views
    if (!profile.linkClicks) {
      profile.linkClicks = [];
    }

    // Add new link click with timestamp
    profile.linkClicks.push({
      link,
      date: new Date(),
      ip: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || '',
      userAgent: req.headers['user-agent'] || ''
    });

    console.log(`[DEBUG] Added link click for ${link}, total clicks: ${profile.linkClicks.length}`);
    
    try {
      await profile.save();
      console.log(`[DEBUG] Profile saved successfully`);
    } catch (saveError) {
      console.error('[ERROR] Failed to save profile:', saveError);
      return res.status(500).json({ message: 'Failed to save profile update' });
    }

    // Calculate total taps for this link
    const linkTaps = profile.linkClicks.filter(click => click.link === link).length;

    res.json({ 
      message: 'Link tap recorded', 
      link, 
      totalTaps: linkTaps,
      allTaps: profile.linkClicks.reduce((acc, click) => {
        acc[click.link] = (acc[click.link] || 0) + 1;
        return acc;
      }, {})
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

    // Initialize contactExchanges as an array of objects, similar to views
    if (!profile.contactExchanges) {
      profile.contactExchanges = [];
    }

    // Add new contact exchange with timestamp
    profile.contactExchanges.push({
      date: new Date(),
      ip: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || '',
      userAgent: req.headers['user-agent'] || ''
    });

    console.log(`[DEBUG] Added contact exchange, total exchanges: ${profile.contactExchanges.length}`);

    try {
      await profile.save();
      console.log(`[DEBUG] Profile saved successfully`);
    } catch (saveError) {
      console.error('[ERROR] Failed to save profile:', saveError);
      return res.status(500).json({ message: 'Failed to save profile update' });
    }

    res.json({ 
      message: 'Contact download recorded', 
      totalDownloads: profile.contactExchanges.length 
    });
  } catch (err) {
    console.error('[ERROR] Error recording contact download:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;