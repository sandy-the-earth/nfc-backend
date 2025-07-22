const mongoose = require('mongoose');

// Subscription sub-schema
const subscriptionSchema = new mongoose.Schema({
  plan: { type: String, default: null },
  cycle: { type: String, default: null },
  activatedAt: { type: Date, default: null },
  code: { type: String, default: null }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  // Unique code embedded in NFC card
  activationCode: {
    type: String,
    required: true,
    unique: true
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending_activation', 'active'],
    default: 'pending_activation'
  },

  // Owner authentication
  ownerEmail: {
    type: String,
    default: null
  },
  ownerPasswordHash: {
    type: String,
    default: null
  },

  // Image URLs (Cloudinary or local)
  bannerUrl: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },

  // Identity
  name: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },

  // Calendly integration for meeting scheduling
  calendlyLink: {
    type: String,
    default: ''
  },

  // Social handles
  socialLinks: {
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },

  // Remove or deprecate profile.subscriptionPlan from Profile schema
  // (You may want to run a migration to remove this field from the database if not needed)

  // Contact exchanges (single object version)
  contactExchanges: {
    count: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },

  // 🔹 Optional custom slug for selected users
  customSlug: {
    type: String,
    unique: true,
    sparse: true, // allow many documents to not have it
    match: /^[a-z0-9_-]{3,30}$/ // basic validation: lowercase letters, numbers, hyphen, underscore
  },

  // 🔹 Exclusive badge for special profiles
  exclusiveBadge: {
    text: { type: String, default: null }
  },

  // Password reset functionality
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },

  // Dashboard insights tracking
  views: [
    {
      date: { type: Date, default: Date.now },
      ip: String,
      userAgent: String,
      industry: { type: String, default: '' }, // Added for corporate insight
      company: { type: String, default: '' }   // Optional
    }
  ],
  contactSaves: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: null
  },
  // Link tap analytics: stores { [link]: count }
  linkClicks: {
    type: Object,
    default: {}
  },
  insightsEnabled: {
    type: Boolean,
    default: false
  },

  // Add industry field to the profile schema
  industry: {
    type: String,
    default: ''
  },

  // Add theme field to the profile schema
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },

  // Subscription info
  subscription: { type: subscriptionSchema, default: () => ({}) },

  // Contact downloads (separate from exchanges)
  contactDownloads: {
    type: Number,
    default: 0
  },

  // Deactivation flag
  active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

// 🔹 Ensure only one active profile per email
profileSchema.index(
  { ownerEmail: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ownerEmail: { $type: 'string' },
      status: 'active'
    }
  }
);

// 🔹 Enforce uniqueness on customSlug
profileSchema.index(
  { customSlug: 1 },
  { unique: true, sparse: true }
);

// Add a static list of available industries
const availableIndustries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Hospitality",
  "Real Estate",
  "Transportation",
  "Energy",
  "Entertainment",
  "Agriculture",
  "Government",
  "Non-Profit",
  "Other"
];

profileSchema.statics.getAvailableIndustries = function () {
  return availableIndustries;
};

module.exports = mongoose.model('Profile', profileSchema);