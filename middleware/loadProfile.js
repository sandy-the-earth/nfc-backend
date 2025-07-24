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
    
    const fullProfile = profile.toObject();
    const moment = require('moment-timezone');

    fullProfile.slug = profile.customSlug || profile.activationCode;
    fullProfile.email = profile.ownerEmail || '';

    // Format lastViewedAt in DD_MM_YYYY (IST)
    if (profile.lastViewedAt) {
      fullProfile.lastViewedAtFormatted = moment(profile.lastViewedAt).tz('Asia/Kolkata').format('DD_MM_YYYY');
    }

    // Format all view dates
    if (Array.isArray(fullProfile.views)) {
      fullProfile.views = fullProfile.views.map(view => ({
        ...view,
        formattedDate: moment(view.date).tz('Asia/Kolkata').format('DD_MM_YYYY'),
      }));
    }

    
    // Save the profile with view tracking
    return profile.save().then(() => {
      // Use all fields from the profile
      const fullProfile = profile.toObject();
      fullProfile.slug = profile.customSlug || profile.activationCode;
      fullProfile.email = profile.ownerEmail || '';
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