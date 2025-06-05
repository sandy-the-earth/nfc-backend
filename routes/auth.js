const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Profile = require('../models/Profile');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// POST /api/auth/activate-profile
// Activates a profile using activation code, email, and password
router.post('/activate-profile', async (req, res) => {
  try {
    const { activationCode, email, password } = req.body;

    // 1. Required fields check
    if (!activationCode || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }

    // 3. Password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 4. Check activation code or custom slug
    const profile = await Profile.findOne({
      $or: [
        { activationCode },
        { customSlug: activationCode }
      ]
    });
    if (!profile) {
      return res.status(404).json({ message: 'Invalid activation code' });
    }

    // 5. Prevent re-activation
    if (profile.status === 'active') {
      return res.status(400).json({ message: 'This activation code has already been used' });
    }

    // 6. Check if email is already used in another profile
    const existingEmail = await Profile.findOne({ ownerEmail: email, status: 'active' });
    if (existingEmail) {
      return res.status(400).json({ message: 'This email is already in use by another profile' });
    }

    // 7. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 8. Update profile
    profile.ownerEmail = email;
    profile.ownerPasswordHash = hashedPassword;
    profile.status = 'active';
    await profile.save();

    res.status(200).json({ message: 'Profile activated successfully' });
  } catch (err) {
    console.error('Error activating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
// Accepts: { email }
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const profile = await Profile.findOne({ ownerEmail: email, status: 'active' });
    if (!profile) return res.status(404).json({ message: 'No active profile found with this email' });

    // Generate token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 1000 * 60 * 60;
    profile.resetPasswordToken = token;
    profile.resetPasswordExpires = tokenExpiry;
    await profile.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: `commaCards <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your commaCards password',
      text: `You requested a password reset. Click the link below to set a new password.\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, you can ignore this email.`
    });
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
// Accepts: { token, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    const profile = await Profile.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      status: 'active'
    });
    if (!profile) return res.status(400).json({ message: 'Invalid or expired token' });
    const salt = await bcrypt.genSalt(10);
    profile.ownerPasswordHash = await bcrypt.hash(newPassword, salt);
    profile.resetPasswordToken = undefined;
    profile.resetPasswordExpires = undefined;
    await profile.save();
    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;