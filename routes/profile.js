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
    // Always expose a single 'slug' field
    const slug = profile.customSlug || profile.activationCode;
    res.json({ ...profile.toObject(), slug });
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
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!profile.insightsEnabled) {
      return res.status(403).json({ message: 'Insights are not enabled for this profile.' });
    }

    // Initialize arrays/objects if they don't exist
    if (!profile.views) profile.views = [];
    if (!profile.linkClicks) profile.linkClicks = new Map();
    if (typeof profile.contactExchanges !== 'number') profile.contactExchanges = 0;
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
    
    if (profile.linkClicks) {
      // Convert Map to Object if it's a Map
      const linkClicksObj = profile.linkClicks instanceof Map 
        ? Object.fromEntries(profile.linkClicks)
        : profile.linkClicks;

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
    }

    console.log(`[Insights] Profile: ${profile._id}, Views: ${profile.views.length}, Unique: ${uniqueSet.size}, Links: ${totalLinkTaps}, Downloads: ${profile.contactExchanges}`);

    res.json({
      totalViews: profile.views.length,
      uniqueVisitors: uniqueSet.size,
      contactExchanges: profile.contactExchanges,
      contactSaves: profile.contactSaves,
      viewCountsOverTime,
      linkTapsOverTime,
      lastViewedAt: profile.lastViewedAt,
      mostPopularContactMethod: topLink,
      totalLinkTaps,
      topLink,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    });
  } catch (err) {
    console.error('Dashboard insights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;