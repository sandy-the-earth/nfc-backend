// routes/admin.js

const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
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

    // Normalize subscription for each profile
    const normalizedProfiles = profiles.map(profile => {
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
      // Add a computed status field for admin dashboard
      const computedStatus = profile.active === false ? 'deactivated' : (profile.status || 'active');
      return {
        ...profile.toObject(),
        subscription,
        computedStatus // This will show 'deactivated' if profile is not active
      };
    });

    res.json({
      data: normalizedProfiles,
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
      // Always include subscription field, even if not active
      subscription = {
        plan: null,
        cycle: null,
        activatedAt: null,
        expiresAt: null
      };
    }
    res.json({
      ...profile.toObject(),
      subscription
    });
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

// Unified: PUT /api/admin/profile/:id/subscription
router.put('/profile/:id/subscription', async (req, res) => {
  try {
    const { plan, cycle, activatedAt } = req.body;

    if (!['Novice', 'Corporate', 'Elite'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Always update subscriptionPlan
    profile.subscriptionPlan = plan;

    // Optionally update full subscription metadata
    if (cycle) {
      if (!['monthly', 'quarterly'].includes(cycle)) {
        return res.status(400).json({ message: 'Invalid cycle' });
      }

      const activationDate = activatedAt ? new Date(activatedAt) : new Date();
      profile.subscription = {
        plan,
        cycle,
        activatedAt: activationDate,
        code: profile.subscription?.code || null
      };
    }

    await profile.save();

    // Compose normalized response
    let responseSubscription = null;
    if (profile.subscription?.plan && profile.subscription?.activatedAt) {
      const { cycle, activatedAt } = profile.subscription;
      let expiresAt = null;
      if (cycle && activatedAt) {
        const start = new Date(activatedAt);
        expiresAt = cycle === 'monthly'
          ? new Date(start.setMonth(start.getMonth() + 1))
          : new Date(start.setMonth(start.getMonth() + 3));
      }
      responseSubscription = {
        plan,
        cycle: profile.subscription.cycle,
        activatedAt: profile.subscription.activatedAt,
        expiresAt: expiresAt ? expiresAt.toISOString() : null
      };
    }

    res.status(200).json({
      ...profile.toObject(),
      subscription: responseSubscription
    });

  } catch (err) {
    console.error('Admin: error updating subscription plan', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ACTIVATE PROFILE ─────────────────────────────────────────────────
// PATCH /api/admin/profile/:id/activate
router.patch('/profile/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findByIdAndUpdate(id, { active: true }, { new: true });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ message: 'Profile activated', profile });
  } catch (err) {
    console.error('Admin: error activating profile', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin-bs1978av1123ss2402/profile/:id/toggle-status
router.patch('/profile/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.active = !profile.active;
    await profile.save();
    res.json({ message: `Profile status toggled to ${profile.active ? 'active' : 'deactivated'}`, active: profile.active, profile });
  } catch (err) {
    console.error('Admin: error toggling profile status', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;