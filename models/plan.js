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
    features: ['Basic Profile Detailing', 
        'Contact Exchanges - 10 credits/month', 'Basic Insights- Profile views, Unique visitors Count', 
        'Profile Customization - Classic & Chrome - 3 colors', 'Card Insurance*-Upto 2 months' ]
  },
  {
    id: 'corporate',
    name: 'Corporate',
    prices: { monthly: 199, quarterly: 399 },
    features: ['Advanced Profiling', 'Company details, Brochures', 
        'Calendar Blocking', 'Contact Exchanges - 50 credits/month', 
        'Industry wise insights, intermediate profile analytics',
        'Profile Customization - Classic & Chrome - 3 colors', 
        'Card Insurance*-Upto 6 months']
  },
  {
    id: 'elite',
    name: 'Elite',
    prices: { monthly: 299, quarterly: 599 },
    features: ['Access to all the available features', 
        'Get invited to closed invite-only networking events', 
        'Detailed profile performance analysis', 'On profile calendar booking', 
        'Unlimited contact exchanges', 'Exclusive Badge on Profile',
        'Custom materials and colors Customization',
        'Card Insurance*-Upto 12 months', 'Priority Support 24x7']
  },
];

module.exports = { plans };
