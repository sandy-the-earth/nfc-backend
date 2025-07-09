// utils/fieldFilter.js
const PLAN_FIELDS = {
  Novice: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks'],
  Corporate: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks', 'industry', 'website'],
  Elite: null  // null = no filtering
};

// Fields that should always be included regardless of subscription plan
const COMMON_FIELDS = ['slug', 'bannerUrl', 'avatarUrl', 'theme', 'createdAt', 'email'];

function filterByPlan(profileObj) {
  // Use the correct source of truth for plan
  const plan = (profileObj.subscription && profileObj.subscription.plan) || 'Novice';
  const allowed = PLAN_FIELDS[plan];

  // Start with common fields that are always included
  const filtered = {};
  COMMON_FIELDS.forEach(field => {
    if (profileObj[field] !== undefined) {
      filtered[field] = profileObj[field];
    }
  });

  // Always include subscription.plan in the response
  filtered.subscription = filtered.subscription || {};
  filtered.subscription.plan = plan;

  // If Elite plan, include all fields and check for missing required fields
  if (!allowed) {
    const eliteRequired = [
      'name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks',
      'industry', 'website', 'bannerUrl', 'avatarUrl', 'theme', 'email'
    ];
    const missing = eliteRequired.filter(f => profileObj[f] === undefined || profileObj[f] === null || profileObj[f] === '');
    if (missing.length > 0) {
      // Log a warning (server-side) if any required fields are missing for Elite
      console.warn(`Elite profile missing fields: ${missing.join(', ')}`);
    }
    // Ensure subscription.plan is present in Elite response
    const eliteProfile = { ...profileObj };
    eliteProfile.subscription = eliteProfile.subscription || {};
    eliteProfile.subscription.plan = plan;
    return eliteProfile;
  }

  // For other plans, only include allowed fields
  allowed.forEach(field => {
    if (profileObj[field] !== undefined) {
      filtered[field] = profileObj[field];
    }
  });

  return filtered;
}

module.exports = { filterByPlan };