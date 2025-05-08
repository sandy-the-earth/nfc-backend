// routes/contact.js
const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const nodemailer = require('nodemailer');

// POST /api/contact/:activationCode
router.post('/:activationCode', async (req, res) => {
  try {
    const { name, email, message, place, date, event } = req.body;
    const profile = await Profile.findOne({ activationCode: req.params.activationCode });
    if (!profile || !profile.ownerEmail) {
      return res.status(404).json({ message: 'Profile not found or missing email' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"commaCards Contact" <${process.env.EMAIL_USER}>`,
      to: profile.ownerEmail,
      subject: `New contact from ${name}`,
      text: `
New message from your commaCard profile:

👤 Name: ${name}
✉️ Email: ${email}
📍 Place: ${place}
📅 Date: ${date}
🎯 Event: ${event}

📝 Message:
${message}
      `
    });

    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;