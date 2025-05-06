// routes/admin.js

const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { Parser } = require('json2csv');

// Helper to generate a unique activation code
function generateActivationCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  } while (false); // we'll check uniqueness below
  return code;
}

// ─── CREATE NEW PROFILE ───────────────────────────────────────────────
// POST /api/admin/create-profile
router.post('/create-profile', async (req, res) => {
  try {
    let activationCode;
    let existing;
    // Keep generating until unique
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
    res.json({ data: profiles, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('Admin: error listing profiles', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── TOGGLE PROFILE STATUS ────────────────────────────────────────────
// PUT /api/admin/toggle-status/:id
router.put('/toggle-status/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.status = profile.status === 'active' ? 'pending_activation' : 'active';
    await profile.save();
    res.json({ message: 'Status updated', status: profile.status });
  } catch (err) {
    console.error('Admin: error toggling status', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE PROFILE ───────────────────────────────────────────────────
// DELETE /api/admin/profiles/:id
router.delete('/profiles/:id', async (req, res) => {
  try {
    const result = await Profile.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Profile not found' });
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
      'createdAt'
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

module.exports = router;