const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const loadProfile = require('../middleware/loadProfile');
const planGate = require('../middleware/planGate');

// 🔹 GET public profile by activationCode OR customSlug
router.get('/:activationCode', loadProfile, planGate, (req, res) => {
  if (res.locals.profile.active === false) {
    return res.status(403).json({ error: 'Profile deactivated' });
  }
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
    if (profile.active === false) return res.status(403).json({ error: 'Profile deactivated' });

    // Calculate unique visitors (by ip+userAgent)
    const uniqueSet = new Set(profile.views.map(v => v.ip + '|' + v.userAgent));

    // Calculate total link taps and top link
    const linkClicksObj = profile.linkClicks || {};
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

    // Industry aggregation for Corporate and Elite profiles
    let industryAggregation = undefined;
    const plan = profile.subscriptionPlan || profile.subscription?.plan;
    console.log('Debug - Profile plan:', plan);
    if (plan === 'Corporate' || plan === 'Elite') {
      industryAggregation = {};
      console.log('Debug - Processing views for industry aggregation. Total views:', profile.views.length);
      for (const v of profile.views) {
        if (v.industry && v.industry.trim()) {
          industryAggregation[v.industry] = (industryAggregation[v.industry] || 0) + 1;
          console.log('Debug - Found view with industry:', v.industry);
        }
      }
      console.log('Debug - Final industryAggregation:', industryAggregation);
    }

    const responseObj = {
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
      updatedAt: profile.updatedAt,
      ...(industryAggregation ? { viewsByIndustry: industryAggregation } : {})
    };
    console.log('Debug - Final response object keys:', Object.keys(responseObj));
    res.json(responseObj);
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
    profile.linkClicks[link] = (profile.linkClicks[link] || 0) + 1;
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

// POST /api/public/:activationCode/view - Record a profile view with industry/company for Corporate
router.post('/:activationCode/view', async (req, res) => {
  try {
    const { industry, company } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    if (profile.active === false) {
      return res.status(403).json({ error: 'Profile deactivated' });
    }

    // Only require industry/company for Corporate or Elite plan
    const plan = profile.subscriptionPlan || profile.subscription?.plan;
    if (plan === 'Corporate' || plan === 'Elite') {
      if (!industry || typeof industry !== 'string' || !industry.trim()) {
        return res.status(400).json({ message: 'Industry is required for this profile.' });
      }
    }

    // Add the view
    profile.views.push({
      date: new Date(),
      ip,
      userAgent,
      industry: (plan === 'Corporate' || plan === 'Elite') ? industry : '',
      company: (plan === 'Corporate' || plan === 'Elite') ? (company || '') : ''
    });
    profile.lastViewedAt = new Date();
    await profile.save();

    res.json({ message: 'View recorded' });
  } catch (err) {
    console.error('Error recording view:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;