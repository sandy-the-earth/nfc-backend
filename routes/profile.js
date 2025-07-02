const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// 🔹 Reserved slugs (forbidden values)
const RESERVED_SLUGS = ['admin', 'dashboard', 'login', 'logout', 'api', 'p'];

// 🔹 Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'nfc-profiles',
    public_id: `${req.params.id}-${file.fieldname}`,
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  }),
});
const upload = multer({ storage });

// GET /api/profile/industries - must be before any :id route
router.get('/industries', (req, res) => {
  try {
    const industries = Profile.getAvailableIndustries();
    res.json({ industries });
  } catch (err) {
    console.error('Error fetching industries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 GET profile by ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!profile.active) return res.status(403).json({ error: 'Profile deactivated' });
    // Always expose a single 'slug' field
    const slug = profile.customSlug || profile.activationCode;
    // Prepare subscription details with expiresAt
    let subscription = null;
    if (profile.subscription && profile.subscription.plan && profile.subscription.activatedAt) {
      const { plan, cycle, activatedAt, code } = profile.subscription;
      let expiresAt = null;
      if (cycle && activatedAt) {
        const start = new Date(activatedAt);
        if (cycle === 'monthly') {
          expiresAt = new Date(start.setMonth(start.getMonth() + 1));
        } else if (cycle === 'quarterly') {
          expiresAt = new Date(start.setMonth(start.getMonth() + 3));
        }
      }
      subscription = {
        plan,
        cycle,
        activatedAt: profile.subscription.activatedAt,
        expiresAt: expiresAt ? expiresAt.toISOString() : null
      };
    } else {
      subscription = {
        plan: null,
        cycle: null,
        activatedAt: null,
        expiresAt: null
      };
    }
    res.json({ ...profile.toObject(), slug, subscription });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 UPDATE profile info
router.put('/:id', async (req, res) => {
  try {
    const {
      name, title, subtitle, tags, bio,
      location, phone, website, socialLinks, ownerEmail, industry
    } = req.body;

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      {
        name, title, subtitle, tags, bio,
        location, phone, website, socialLinks, ownerEmail, industry
      },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ message: 'Profile updated', profile });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 UPLOAD avatar
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: 'No file uploaded or upload failed' });
  }
  try {
    await Profile.findByIdAndUpdate(req.params.id, { avatarUrl: req.file.path });
    res.json({ url: req.file.path });
  } catch (err) {
    console.error('Avatar upload failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 UPLOAD banner
router.post('/:id/banner', upload.single('banner'), async (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: 'No file uploaded or upload failed' });
  }
  try {
    await Profile.findByIdAndUpdate(req.params.id, { bannerUrl: req.file.path });
    res.json({ url: req.file.path });
  } catch (err) {
    console.error('Banner upload failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 SET custom slug
router.patch('/:id/custom-slug', async (req, res) => {
  const { customSlug } = req.body;
  const { id } = req.params;

  // Basic validation
  const validSlug = /^[a-z0-9_-]{3,30}$/.test(customSlug);
  if (!customSlug || !validSlug) {
    return res.status(400).json({ message: 'Invalid slug format' });
  }

  if (RESERVED_SLUGS.includes(customSlug)) {
    return res.status(403).json({ message: 'This slug is reserved' });
  }

  try {
    const existing = await Profile.findOne({ customSlug });
    if (existing) {
      return res.status(409).json({ message: 'Slug already taken' });
    }

    const profile = await Profile.findByIdAndUpdate(id, { customSlug }, { new: true });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    // Log for debugging
    console.log(`[CustomSlug] Updated profile ${id} with customSlug: ${profile.customSlug}`);
    // Always expose a single 'slug' field in the response
    const slug = profile.customSlug || profile.activationCode;
    res.json({ message: 'Custom slug set successfully', profile: { ...profile.toObject(), slug } });
  } catch (err) {
    console.error('Error setting custom slug:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/profile/:id/exclusive-badge
// Body: { text: string | null }
router.patch('/:id/exclusive-badge', async (req, res) => {
  try {
    const { text } = req.body;
    const update = text ? { exclusiveBadge: { text } } : { exclusiveBadge: { text: null } };
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: text ? 'Exclusive badge set' : 'Exclusive badge removed', profile });
  } catch (err) {
    console.error('Error updating exclusive badge:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/profile/:id/theme
router.patch('/:id/theme', async (req, res) => {
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({ message: 'Invalid theme' });
  }
  const profile = await Profile.findByIdAndUpdate(
    req.params.id,
    { theme },
    { new: true }
  );
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ message: 'Theme updated', theme: profile.theme });
});

// GET /api/profile/:id/insights (dashboard only, for owner)
router.get('/:id/insights', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    if (!profile.active) return res.status(403).json({ error: 'Profile deactivated' });

    if (!profile.insightsEnabled) {
      return res.status(403).json({ message: 'Insights are not enabled for this profile.' });
    }

    // Initialize arrays/objects if they don't exist
    if (!profile.views) profile.views = [];
    if (!profile.linkClicks) profile.linkClicks = new Map();
    if (!profile.contactExchanges) profile.contactExchanges = { count: 0, lastReset: new Date() };
    if (typeof profile.contactSaves !== 'number') profile.contactSaves = 0;

    // Aggregate views by day
    const viewCountsMap = {};
    for (const v of profile.views) {
      const d = new Date(v.date);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      viewCountsMap[dateStr] = (viewCountsMap[dateStr] || 0) + 1;
    }
    const viewCountsOverTime = Object.entries(viewCountsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate unique visitors
    const uniqueSet = new Set(profile.views.map(v => v.ip + '|' + v.userAgent));

    // Process link clicks
    let totalLinkTaps = 0;
    let topLink = null;
    let maxTaps = 0;
    let linkTapsOverTime = [];
    
    // Ensure linkClicks is an object
    const linkClicksObj = profile.linkClicks || {};

    // Calculate total taps and find top link
    for (const [link, count] of Object.entries(linkClicksObj)) {
      totalLinkTaps += count;
      if (count > maxTaps) {
        maxTaps = count;
        topLink = link;
      }
    }

    // Create link taps over time data
    linkTapsOverTime = Object.entries(linkClicksObj)
      .map(([link, count]) => ({ link, count }))
      .sort((a, b) => b.count - a.count);

    // Contact exchange credits logic
    const getContactLimit = (plan) => {
      switch (plan) {
        case 'Novice': return 20;
        case 'Corporate': return 50;
        case 'Elite': return Infinity;
        default: return 0;
      }
    };
    // Use plan from profile.subscription, not profile.subscriptionPlan
    const plan = profile.subscription && profile.subscription.plan ? profile.subscription.plan : 'Novice';
    const limit = getContactLimit(plan);
    const used = profile.contactExchanges.count;
    const remaining = limit === Infinity ? 'Unlimited' : Math.max(0, limit - used);

    // Prepare normalized subscription object
    let subscription = null;
    if (profile.subscription && profile.subscription.plan && profile.subscription.activatedAt) {
      const { plan, cycle, activatedAt } = profile.subscription;
      let expiresAt = null;
      if (cycle && activatedAt) {
        const start = new Date(activatedAt);
        if (cycle === 'monthly') {
          expiresAt = new Date(start.setMonth(start.getMonth() + 1));
        } else if (cycle === 'quarterly') {
          expiresAt = new Date(start.setMonth(start.getMonth() + 3));
        }
      }
      subscription = {
        plan,
        cycle,
        activatedAt: profile.subscription.activatedAt,
        expiresAt: expiresAt ? expiresAt.toISOString() : null
      };
    } else {
      subscription = {
        plan: null,
        cycle: null,
        activatedAt: null,
        expiresAt: null
      };
    }

    res.json({
      totalViews: profile.views.length,
      uniqueVisitors: uniqueSet.size,
      contactExchanges: used,
      contactExchangeLimit: limit,
      contactExchangeRemaining: remaining,
      contactSaves: profile.contactSaves,
      contactDownloads: profile.contactDownloads || 0,
      viewCountsOverTime,
      linkTapsOverTime,
      lastViewedAt: profile.lastViewedAt,
      totalLinkTaps,
      topLink,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      subscription
    });
  } catch (err) {
    console.error('Dashboard insights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/profile/exchange/:profileId - record a contact exchange and enforce plan limits
router.post('/exchange/:profileId', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const now = new Date();
    const lastReset = new Date(profile.contactExchanges.lastReset);
    const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    if (isNewMonth) {
      profile.contactExchanges.count = 0;
      profile.contactExchanges.lastReset = now;
    }

    const limit = getContactLimit(profile.subscription.plan);
    if (profile.contactExchanges.count >= limit) {
      return res.status(403).json({ message: 'Monthly contact exchange limit reached' });
    }

    // [Insert logic to save contact request here if any, e.g. to database or email]
    profile.contactExchanges.count += 1;
    await profile.save();

    res.status(200).json({ message: 'Contact exchange recorded successfully' });
  } catch (error) {
    console.error('Contact exchange error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/profile/:id/deactivate
router.patch('/:id/deactivate', async (req, res) => {
  const { id } = req.params;
  await Profile.findByIdAndUpdate(id, { active: false });
  res.json({ success: true });
});

module.exports = router;