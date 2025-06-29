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
    
    // Use all fields from the profile
    const fullProfile = profile.toObject();
    fullProfile.slug = profile.customSlug || profile.activationCode;
    res.locals.profile = fullProfile;
    next();
  })
  .catch(err => {
    console.error('❌ Profile load error:', err);
    res.status(500).json({ message: 'Server error' });
  });
}

module.exports = loadProfileNoTracking; 