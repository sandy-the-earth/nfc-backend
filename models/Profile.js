// ✅ Cleaned-up schema
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  activationCode: { type: String, unique: true, required: true },
  status: {
    type: String,
    enum: ['pending_activation', 'active'],
    default: 'pending_activation'
  },
  ownerEmail: { type: String, default: null },
  ownerPasswordHash: { type: String, default: null },

  // Profile visuals
  bannerUrl: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },

  // Identity
  name: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  tags: { type: [String], default: [] },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },

  // Social links
  socialLinks: {
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);