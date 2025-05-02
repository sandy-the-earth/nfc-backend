const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage setup for avatar & banner uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const field = file.fieldname;
    cb(null, `${req.params.id}-${field}${ext}`);
  }
});
const upload = multer({ storage });


// 🔹 Get profile by ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Update profile info
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

// 🔹 Upload avatar
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  try {
    await Profile.findByIdAndUpdate(req.params.id, { avatarUrl: url });
    res.json({ url });
  } catch (err) {
    console.error('Avatar upload failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Upload banner
router.post('/:id/banner', upload.single('banner'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  try {
    await Profile.findByIdAndUpdate(req.params.id, { bannerUrl: url });
    res.json({ url });
  } catch (err) {
    console.error('Banner upload failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;