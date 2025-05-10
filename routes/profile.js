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
      location, phone, website, socialLinks, ownerEmail
    } = req.body;

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      {
        name, title, subtitle, tags, bio,
        location, phone, website, socialLinks, ownerEmail
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

    res.json({ message: 'Custom slug set successfully', profile });
  } catch (err) {
    console.error('Error setting custom slug:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;