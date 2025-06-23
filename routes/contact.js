// routes/contact.js
const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const nodemailer = require('nodemailer');

// POST /api/contact/:activationCode or customSlug
router.post('/:activationCode', async (req, res) => {
  try {
    const { name, email, message, place, date, event } = req.body;
    // Allow lookup by activationCode or customSlug
    const profile = await Profile.findOne({
      $or: [
        { activationCode: req.params.activationCode },
        { customSlug: req.params.activationCode }
      ]
    });
    if (!profile || !profile.ownerEmail) {
      return res.status(404).json({ message: 'Profile not found or missing email' });
    }

    // Increment contactExchanges for insights (ensure object format)
    if (!profile.contactExchanges || typeof profile.contactExchanges !== 'object') {
      profile.contactExchanges = { count: 0, lastReset: new Date() };
    }
    profile.contactExchanges.count += 1;
    await profile.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465, // or use 587 if you prefer TLS
      secure: true, // true for port 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"commaCards Connection" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: profile.ownerEmail,
      bcc: process.env.MODERATOR_EMAIL,
      subject: `no-reply - Comma Connection Request from ${name}`,
      text: `
    📬 You've received a new message via your commaCard profile!
    
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