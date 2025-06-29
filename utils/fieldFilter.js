// utils/fieldFilter.js
const PLAN_FIELDS = {
  Novice: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks'],
  Corporate: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks', 'industry', 'website'],
  Elite: null  // null = no filtering
};

// Fields that should always be included regardless of subscription plan
const COMMON_FIELDS = ['slug', 'bannerUrl', 'avatarUrl', 'theme', 'createdAt', 'exclusiveBadge', 'email'];

function filterByPlan(profileObj) {
  const plan = profileObj.subscriptionPlan || 'Novice';
  const allowed = PLAN_FIELDS[plan];
  
  // Start with common fields that are always included
  const filtered = {};
  COMMON_FIELDS.forEach(field => {
    if (profileObj[field] !== undefined) {
      filtered[field] = profileObj[field];
    }
  });
  
  // If Elite plan, include all fields
  if (!allowed) {
    return profileObj;
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