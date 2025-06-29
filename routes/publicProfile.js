const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const loadProfile = require('../middleware/loadProfile');
const planGate = require('../middleware/planGate');

// 🔹 GET public profile by activationCode OR customSlug
router.get('/:activationCode', loadProfile, planGate, (req, res) => {
  res.json(res.locals.filteredProfile);
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

    // Calculate total link taps and top link
    const linkClicksObj = profile.linkClicks || {};
    console.log('[INSIGHTS] Aggregating linkClicks:', linkClicksObj); // Debug log
    let totalLinkTaps = 0;
    let topLink = null;
    let maxTaps = 0;
    for (const [link, count] of Object.entries(linkClicksObj)) {
      if (typeof count === 'number' && isFinite(count)) {
        totalLinkTaps += count;
        if (count > maxTaps) {
          maxTaps = count;
          topLink = link;
        }
      }
    }
    // Ensure totalLinkTaps is a number
    if (typeof totalLinkTaps !== 'number' || isNaN(totalLinkTaps) || !isFinite(totalLinkTaps)) {
      totalLinkTaps = 0;
    }

    // Contact exchange credits logic
    const getContactLimit = (plan) => {
      switch (plan) {
        case 'Novice': return 20;
        case 'Corporate': return 50;
        case 'Elite': return Infinity;
        default: return 0;
      }
    };
    const limit = getContactLimit(profile.subscriptionPlan);
    const used = profile.contactExchanges?.count || 0;
    const remaining = limit === Infinity ? 'Unlimited' : Math.max(0, limit - used);

    res.json({
      totalViews: profile.views.length,
      uniqueVisitors: uniqueSet.size,
      contactExchanges: used,
      contactExchangeLimit: limit,
      contactExchangeRemaining: remaining,
      contactDownloads: profile.contactDownloads || 0,
      lastViewedAt: profile.lastViewedAt,
      totalLinkTaps,
      topLink,
      linkClicks: linkClicksObj,
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

    // Ensure linkClicks is a plain object
    if (!profile.linkClicks || typeof profile.linkClicks !== 'object' || Array.isArray(profile.linkClicks)) {
      profile.linkClicks = {};
    }
    console.log('[LINK-TAP] Before tap:', profile.linkClicks); // Debug log
    profile.linkClicks[link] = (profile.linkClicks[link] || 0) + 1;
    console.log('[LINK-TAP] After tap:', profile.linkClicks); // Debug log
    try {
      await profile.save();
    } catch (e) {
      console.error('Error saving profile after link tap:', e);
      return res.status(500).json({ message: 'Failed to save link tap' });
    }

    res.json({ 
      message: 'Link tap recorded', 
      link, 
      totalTaps: profile.linkClicks[link],
      allTaps: profile.linkClicks
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

    // Initialize contactDownloads if it doesn't exist
    if (typeof profile.contactDownloads !== 'number') profile.contactDownloads = 0;
    profile.contactDownloads += 1;
    await profile.save();

    res.json({ 
      message: 'Contact download recorded', 
      totalDownloads: profile.contactDownloads 
    });
  } catch (err) {
    console.error('Error recording contact download:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;