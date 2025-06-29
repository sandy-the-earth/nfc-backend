const { filterByPlan } = require('../utils/fieldFilter');

function planGate(req, res, next) {
  const raw = res.locals.profile;      // assume earlier middleware loaded it
  if (!raw) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  if (raw.subscriptionPlan === 'Elite') {
    console.log('ELITE RAW KEYS:', Object.keys(raw));
  }
  // Apply subscription-based field filtering
  const filteredProfile = filterByPlan(raw);
  if (raw.subscriptionPlan === 'Elite') {
    console.log('ELITE FILTERED KEYS:', Object.keys(filteredProfile));
  }
  // Store the filtered profile in res.locals for the route handler
  res.locals.filteredProfile = filteredProfile;
  
  // Continue to the next middleware or route handler
  next();
}

module.exports = planGate; 