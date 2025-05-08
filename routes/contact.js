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
      replyTo: email,
      to: profile.ownerEmail,
      bcc: process.env.MODERATOR_EMAIL,
      subject: `New contact from ${name}`,
      text: `
    📬 You’ve received a new message via your commaCard profile!
    
    ━━━━━━━━━━━━━━━━━━━━━━━
    
    Hey, this is ${name}, reaching out to you through your commaCards profile!
    
    We met at ${place}, on ${date}, during the event "${event}".
    
    ━━━━━━━━━━━━━━━━━━━━━━━
    
    📝 Message:
    ${message}
    
    You can write back to me at ${email} or reply to this email.
    ━━━━━━━━━━━━━━━━━━━━━━━
    
    This message was submitted through your commaCard public profile.
    Just hit reply to continue the conversation!
    
    — The commaCards Team
      `
    });
    

    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;