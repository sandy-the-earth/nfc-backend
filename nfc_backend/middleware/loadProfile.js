const moment = require('moment-timezone');
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

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Initialize views array if it doesn't exist
    if (!profile.views) {
      profile.views = [];
    }

    // Track view
    profile.views.push({ date: new Date(), ip, userAgent });
    profile.lastViewedAt = new Date();

    // Save the profile with view tracking
    return profile.save().then(() => {
      // Convert to object and add formatted fields
      const fullProfile = profile.toObject();
      fullProfile.slug = profile.customSlug || profile.activationCode;
      fullProfile.email = profile.ownerEmail || '';

      // Format lastViewedAt
      if (profile.lastViewedAt) {
        fullProfile.lastViewedAtFormatted = moment(profile.lastViewedAt)
          .tz('Asia/Kolkata')
          .format('DD_MM_YYYY');
      }

      // Format all views
      if (Array.isArray(fullProfile.views)) {
        fullProfile.views = fullProfile.views.map(view => ({
          ...view,
          formattedDate: moment(view.date).tz('Asia/Kolkata').format('DD_MM_YYYY'),
        }));
      }

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