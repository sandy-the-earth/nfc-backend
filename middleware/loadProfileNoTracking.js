const Profile = require('../models/Profile');

function loadProfileNoTracking(req, res, next) {
  const { activationCode } = req.params;
  
  Profile.findOne({
    $or: [
      { activationCode },
      { customSlug: activationCode }
    ]
  })
  .then(profile => {
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Always expose a single 'slug' field
    const slug = profile.customSlug || profile.activationCode;

    // Create the full profile object
    const fullProfile = {
      slug,
      bannerUrl: profile.bannerUrl || '',
      avatarUrl: profile.avatarUrl || '',
      name: profile.name || '',
      title: profile.title || '',
      subtitle: profile.subtitle || '',
      location: profile.location || '',
      tags: Array.isArray(profile.tags) ? profile.tags : [],
      phone: profile.phone || '',
      website: profile.website || '',
      email: profile.ownerEmail || '',
      socialLinks: {
        instagram: profile.socialLinks?.instagram || '',
        linkedin: profile.socialLinks?.linkedin || '',
        twitter: profile.socialLinks?.twitter || ''
      },
      createdAt: profile.createdAt,
      exclusiveBadge: profile.exclusiveBadge || null,
      industry: profile.industry || '',
      theme: profile.theme || 'light',
      subscriptionPlan: profile.subscriptionPlan || 'Novice'
    };
    
    res.locals.profile = fullProfile;
    next();
  })
  .catch(err => {
    console.error('❌ Profile load error:', err);
    res.status(500).json({ message: 'Server error' });
  });
}

module.exports = loadProfileNoTracking; 