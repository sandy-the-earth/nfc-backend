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
      { name: 'Basic Profile Detailing', description: 'Create and manage a simple profile - Name, Avatar & Banner, Mobile No, Role, Company/School, Tags, Socials - Linkedin, Whatsapp' },
      { name: 'Profile Analytics', description: 'Get basic profile analytics - Profile views, Unique Visiors Count' },
      { name: 'Contact Exchanges - 10 credits/month'},
      { name: 'Profile Customization - Classic & Chrome - 3 colors'},
      { name: 'Card Insurance*-Upto 2 months'}
    ]
  },
  {
    id: 'corporate',
    name: 'Corporate',
    prices: { monthly: 199, quarterly: 399 },
    features: [
      { name: 'Advanced Profiling', description: 'Novice + Industry info, Custom links - websites, brochures, portfolio etc.,'},
      { name: 'Company details, Brochures'},
      { name: 'Calendar Blocking', description: 'Integrate your Calendly profile' },
      { name: 'Contact Exchanges - 50 credits/month'},
      { name: 'Industry wise insights, intermediate profile analytics', description: 'Views grouped by Industry, Contact downloads count, Profile last viewed info' },
      { name: 'Profile Customization - Classic & Chrome - 3 colors'},
      { name: 'Card Insurance*-Upto 6 months'}
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    prices: { monthly: 299, quarterly: 599 },
    features: [
      { name: 'Get access to all the available features'},
      { name: 'Get invited to exclusive invite-only networking events'},
      { name: 'Detailed profile performance analysis', description: 'Get a detailed analysis of your profile performance - info like Highly performing links, Founder-level insights and lot more' },
      { name: 'On profile calendar booking' },
      { name: 'Unlimited contact exchanges', description: 'Exchange contacts without any limits.' },
      { name: 'Exclusive Badge on Profile'},
      { name: 'Custom materials and colors Customization', description: 'Customize materials and colors for your profile.' },
      { name: 'Card Insurance*-Upto 12 months' },
      { name: 'Priority Support 24x7' }
    ]
  },
];

module.exports = { plans };
