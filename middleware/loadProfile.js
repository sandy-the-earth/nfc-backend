const Profile = require('../models/Profile');

function loadProfile(req, res, next) {
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
    
    // Track view (increment views, update lastViewedAt)
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    
    // Initialize views array if it doesn't exist
    if (!profile.views) {
      profile.views = [];
    }
    
    profile.views.push({ date: new Date(), ip, userAgent });
    profile.lastViewedAt = new Date();
    
    // Save the profile with view tracking
    return profile.save().then(() => {
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
    });
  })
  .catch(err => {
    console.error('❌ Profile load error:', err);
    res.status(500).json({ message: 'Server error' });
  });
}

module.exports = loadProfile; 