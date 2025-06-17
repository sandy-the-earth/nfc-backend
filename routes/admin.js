// routes/admin.js

const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const Subscription = require('../models/Subscription');
const { Parser } = require('json2csv');
const adminAuth = require('../middleware/adminauth');

// Apply admin authentication to all admin routes
router.use(adminAuth);

// Helper to generate a unique activation code
function generateActivationCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  } while (false);
  return code;
}

// ─── CREATE NEW PROFILE ───────────────────────────────────────────────
// POST /api/admin/create-profile
router.post('/create-profile', async (req, res) => {
  try {
    let activationCode, existing;
    do {
      activationCode = generateActivationCode();
      existing = await Profile.findOne({ activationCode });
    } while (existing);

    const profile = new Profile({ activationCode });
    await profile.save();
    res.status(201).json({ activationCode });
  } catch (err) {
    console.error('Admin: error creating profile', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── LIST & SEARCH PROFILES ─────────────────────────────────────────
// GET /api/admin/profiles?status=active|pending_activation&search=&page=&limit=
router.get('/profiles', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && ['active', 'pending_activation'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { activationCode: regex },
        { ownerEmail: regex },
        { name: regex }
      ];
    }
    const skip = (Math.max(page, 1) - 1) * limit;
    const [profiles, total] = await Promise.all([
      Profile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Profile.countDocuments(filter)
    ]);
    res.json({
      data: profiles,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    console.error('Admin: error listing profiles', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── SET PROFILE STATUS ──────────────────────────────────────────────
// PUT /api/admin/set-status/:id
// Body: { status: 'active' | 'pending_activation' }
router.put('/set-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending_activation'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: `Status updated to '${status}'`, profile });
  } catch (err) {
    console.error('Admin: error setting status', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE PROFILE ───────────────────────────────────────────────────
// DELETE /api/admin/profiles/:id
router.delete('/profiles/:id', async (req, res) => {
  try {
    const result = await Profile.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    console.error('Admin: error deleting profile', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── EXPORT CSV ───────────────────────────────────────────────────────
// GET /api/admin/export?status=&search=
router.get('/export', async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && ['active', 'pending_activation'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { activationCode: regex },
        { ownerEmail: regex },
        { name: regex }
      ];
    }
    const profiles = await Profile.find(filter).lean();
    const fields = [
      'activationCode',
      'status',
      'ownerEmail',
      'name',
      'title',
      'subtitle',
      'tags',
      'location',
      'phone',
      'website',
      'socialLinks.instagram',
      'socialLinks.linkedin',
      'socialLinks.twitter',
      'createdAt',
      'exclusiveBadge.text'
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(profiles);
    res.header('Content-Type', 'text/csv');
    res.attachment('profiles_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('Admin: error exporting CSV', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── SET/REMOVE EXCLUSIVE BADGE ─────────────────────────────────────────────
// PUT /api/admin/profiles/:id/exclusive-badge
// Body: { text: string | null }
router.put('/profiles/:id/exclusive-badge', async (req, res) => {
  try {
    const { text } = req.body;
    // Allow setting or removing the badge
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
    console.error('Admin: error updating exclusive badge', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ENABLE/DISABLE INSIGHTS ───────────────────────────────────────────────
// PATCH /api/admin/profile/:id/insights-enabled
// Body: { enabled: boolean }
router.patch('/profile/:id/insights-enabled', async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Missing or invalid enabled boolean' });
    }
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { insightsEnabled: enabled },
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: `Insights ${enabled ? 'enabled' : 'disabled'} for profile`, profile });
  } catch (err) {
    console.error('Admin: error updating insightsEnabled', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── FETCH SINGLE PROFILE BY ID ─────────────────────────────────────────────
// GET /api/admin/profile/:id - fetch a single profile by ID
router.get('/profile/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error('Admin: error fetching profile', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin-bs1978av1123ss2402/profile/:id/insights
router.get('/profile/:id/insights', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
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
    // Unique visitors
    const uniqueSet = new Set(profile.views.map(v => v.ip + '|' + v.userAgent));
    // Most popular contact method
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
      contactSaves: profile.contactSaves || 0,
      viewCountsOverTime,
      lastViewedAt: profile.lastViewedAt,
      mostPopularContactMethod,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    });
  } catch (err) {
    console.error('Admin insights error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN DASHBOARD MANAGEMENT ─────────────────────────────────────────────
// GET /api/admin-bs1978av1123ss2402/dashboard/:profileId
router.get('/dashboard/:profileId', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId)
      .populate('subscription')
      .lean();

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get subscription details
    const subscription = await Subscription.findOne({ profileId: profile._id });

    // Get profile insights
    const uniqueSet = new Set(profile.views.map(v => v.ip + '|' + v.userAgent));
    const viewCountsMap = {};
    for (const v of profile.views) {
      const d = new Date(v.date);
      const dateStr = d.toISOString().slice(0, 10);
      viewCountsMap[dateStr] = (viewCountsMap[dateStr] || 0) + 1;
    }

    const viewCountsOverTime = Object.entries(viewCountsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get most popular contact method
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

    // Compile dashboard data
    const dashboardData = {
      profile: {
        _id: profile._id,
        name: profile.name,
        email: profile.ownerEmail,
        status: profile.status,
        createdAt: profile.createdAt,
        lastViewedAt: profile.lastViewedAt,
        exclusiveBadge: profile.exclusiveBadge,
        insightsEnabled: profile.insightsEnabled,
        subscriptionPlan: profile.subscriptionPlan
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        autoRenew: subscription.autoRenew
      } : null,
      insights: {
        totalViews: profile.views.length,
        uniqueVisitors: uniqueSet.size,
        contactExchanges: profile.contactExchanges || 0,
        viewCountsOverTime,
        mostPopularContactMethod,
        linkClicks: Object.fromEntries(profile.linkClicks || new Map())
      }
    };

    res.json(dashboardData);
  } catch (err) {
    console.error('Admin: error fetching dashboard data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;