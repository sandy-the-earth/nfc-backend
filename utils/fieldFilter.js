// utils/fieldFilter.js
const PLAN_FIELDS = {
  Novice: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks'],
  Corporate: ['name', 'title', 'subtitle', 'tags', 'phone', 'socialLinks', 'industry', 'website'],
  Elite: null  // null = no filtering
};

// Fields that should always be included regardless of subscription plan
const COMMON_FIELDS = ['slug', 'bannerUrl', 'avatarUrl', 'theme', 'createdAt', 'exclusiveBadge'];

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

/* // Test function to verify filtering works correctly
function testFieldFilter() {
  const testProfile = {
    slug: 'test123',
    bannerUrl: 'banner.jpg',
    avatarUrl: 'avatar.jpg',
    name: 'John Doe',
    title: 'Developer',
    subtitle: 'Tech Company',
    tags: ['tech', 'developer'],
    phone: '+1234567890',
    website: 'johndoe.com',
    email: 'john@example.com',
    socialLinks: { linkedin: 'linkedin.com/john' },
    industry: 'Technology',
    location: 'New York',
    bio: 'Experienced developer',
    theme: 'light',
    createdAt: new Date(),
    exclusiveBadge: { text: 'VIP' },
    subscriptionPlan: 'Novice'
  };

  console.log('=== Field Filter Test ===');
  console.log('Novice Plan:', Object.keys(filterByPlan({ ...testProfile, subscriptionPlan: 'Novice' })));
  console.log('Corporate Plan:', Object.keys(filterByPlan({ ...testProfile, subscriptionPlan: 'Corporate' })));
  console.log('Elite Plan:', Object.keys(filterByPlan({ ...testProfile, subscriptionPlan: 'Elite' })));
} */

module.exports = { filterByPlan, testFieldFilter }; 