// Plan model (static data, JS version)
/**
 * @typedef {'monthly' | 'quarterly'} BillingCycle
 * @typedef {Object} PlanInfo
 * @property {'novice' | 'corporate' | 'elite'} id
 * @property {string} name
 * @property {{monthly: number, quarterly: number}} prices
 * @property {string[]} features
 */

/** @type {PlanInfo[]} */
const plans = [
  {
    id: 'novice',
    name: 'Novice',
    prices: { monthly: 99, quarterly: 199 },
    features: [
      { name: 'Basic Profile Detailing', description: 'Create and manage a simple profile.' },
      { name: 'Contact Exchanges - 10 credits/month', description: 'Basic Insights- Profile views, Unique visitors Count' },
      { name: 'Profile Customization - Classic & Chrome - 3 colors', description: 'Customize your profile with classic and chrome colors.' },
      { name: 'Card Insurance*-Upto 2 months', description: 'Insurance for your card details for up to 2 months.' }
    ]
  },
  {
    id: 'corporate',
    name: 'Corporate',
    prices: { monthly: 199, quarterly: 399 },
    features: [
      { name: 'Advanced Profiling', description: 'Unlock advanced profile customization and analytics.' },
      { name: 'Company details, Brochures', description: 'Add company details and brochures to your profile.' },
      { name: 'Calendar Blocking', description: 'Block your calendar to manage availability.' },
      { name: 'Contact Exchanges - 50 credits/month', description: 'Exchange contacts with up to 50 credits per month.' },
      { name: 'Industry wise insights, intermediate profile analytics', description: 'Get industry-wise insights and intermediate profile analytics.' },
      { name: 'Profile Customization - Classic & Chrome - 3 colors', description: 'Customize your profile with classic and chrome colors.' },
      { name: 'Card Insurance*-Upto 6 months', description: 'Insurance for your card details for up to 6 months.' }
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    prices: { monthly: 299, quarterly: 599 },
    features: [
      { name: 'Access to all the available features', description: 'Get access to all features available on the platform.' },
      { name: 'Get invited to closed invite-only networking events', description: 'Receive invitations to exclusive networking events.' },
      { name: 'Detailed profile performance analysis', description: 'Get a detailed analysis of your profile performance.' },
      { name: 'On profile calendar booking', description: 'Allow bookings directly on your profile calendar.' },
      { name: 'Unlimited contact exchanges', description: 'Exchange contacts without any limits.' },
      { name: 'Exclusive Badge on Profile', description: 'Receive an exclusive badge to display on your profile.' },
      { name: 'Custom materials and colors Customization', description: 'Customize materials and colors for your profile.' },
      { name: 'Card Insurance*-Upto 12 months', description: 'Insurance for your card details for up to 12 months.' },
      { name: 'Priority Support 24x7', description: 'Receive priority support 24/7.' }
    ]
  },
];

module.exports = { plans };
