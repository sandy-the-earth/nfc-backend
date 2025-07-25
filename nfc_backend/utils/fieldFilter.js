// utils/fieldFilter.js
const PLAN_FIELDS = {
  Novice: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks'],
  Corporate: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks', 'industry', 'website', 'calendlyLink'],
  Elite: null  // null = no filtering
};

// Fields that should always be included regardless of subscription plan
const COMMON_FIELDS = ['slug', 'bannerUrl', 'avatarUrl', 'theme', 'createdAt', 'email'];

function filterByPlan(profileObj) {
  // Use the correct source of truth for plan
  const plan = (profileObj.subscription && profileObj.subscription.plan) || 'Novice';
  const allowed = PLAN_FIELDS[plan];

  // Standardized subscription object
  const subscription = {
    plan: plan,
    cycle: (profileObj.subscription && profileObj.subscription.cycle) || null,
    activatedAt: (profileObj.subscription && profileObj.subscription.activatedAt) || null,
    expiresAt: (profileObj.subscription && profileObj.subscription.expiresAt) || null,
    code: (profileObj.subscription && profileObj.subscription.code) || null
  };

  // If Elite plan, include all fields and ensure consistency
  if (!allowed) {
    const eliteProfile = { ...profileObj };
    eliteProfile.subscription = subscription;
    // Ensure all required fields are present (even if empty)
    const eliteRequired = [
      'name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks',
      'industry', 'website', 'bannerUrl', 'avatarUrl', 'theme', 'email',
      'location', 'customSlug', 'exclusiveBadge', 'createdAt',
      'calendlyLink'
    ];
    eliteRequired.forEach(f => {
      if (eliteProfile[f] === undefined) eliteProfile[f] = null;
    });
    return eliteProfile;
  }

  // For other plans, only include allowed fields + always the standardized subscription object
  const filtered = {};
  COMMON_FIELDS.forEach(field => {
    if (profileObj[field] !== undefined) {
      filtered[field] = profileObj[field];
    } else {
      filtered[field] = null;
    }
  });
  allowed.forEach(field => {
    if (profileObj[field] !== undefined) {
      filtered[field] = profileObj[field];
    } else {
      filtered[field] = null;
    }
  });
  filtered.subscription = subscription;
  return filtered;
}

module.exports = { filterByPlan };