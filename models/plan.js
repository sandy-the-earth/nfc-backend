/**
 * @typedef {'monthly' | 'quarterly'} BillingCycle
 * @typedef {Object} PlanInfo
 * @property {'novice' | 'corporate' | 'elite'}       id
 * @property {string}                                 name
 * @property {{ monthly: number; quarterly: number }} prices
 * @property {string}                                 tagline
 * @property {{ title: string; detail?: string }[]}   benefits
 * @property {string}                                 ctaLabel
 */

/** @type {PlanInfo[]} */
const plans = [
    {
      id: 'novice',
      name: 'Novice',
      prices: { monthly: 99, quarterly: 199 },
      tagline: 'Launch your digital presence',
      benefits: [
        {
          title: 'Branded Digital Profile',
          detail: 'Showcase your name, photo, banner, role, Company/University and more'
        },
        {
          title: 'Essential Analytics',
          detail: 'See total views & unique visitors in real time'
        },
        {
          title: '10 Contact Exchange Credits/mo'
        },
        {
          title: '3 Theme Styles',
          detail: 'Choose from Classic or Chrome, each in 3 accent colors'
        },
        {
          title: 'Comma Insurance for 2 months*'
        }
      ],
      ctaLabel: 'Start Novice – ₹99/mo'
    },
    {
      id: 'corporate',
      name: 'Corporate',
      prices: { monthly: 199, quarterly: 399 },
      tagline: 'Elevate your professional brand',
      benefits: [
        {
          title: 'All Novice Features',
          detail: 'Plus advanced company & portfolio links'
        },
        {
          title: 'Custom Link Library',
          detail: 'Share brochures, websites & Portfolio URLs'
        },
        {
          title: 'Calendar Integration',
          detail: 'Embed your Calendly for instant bookings'
        },
        {
          title: '50 Contact Exchange Credits/mo'
        },
        {
          title: 'Advanced Insights',
          detail: 'Break down views by sector, Contact download counts, etc.,'
        },
        {
          title: 'Comma Insurance for 6 months*'
        }
      ],
      ctaLabel: 'Start Corporate – ₹199/mo'
    },
    {
      id: 'elite',
      name: 'Elite',
      prices: { monthly: 299, quarterly: 599 },
      tagline: 'Unlock the networking power that only few hold',
      benefits: [
        {
          title: 'Access to every single feature that is coded'
        },
        {
          title: 'Exclusive Invite-Only Networking Events',
          detail: 'Access exclusive events & communities'
        },
        {
          title: 'Deep Performance Analytics',
          detail: 'Pinpoint your top–performing links, Founder-level insights and lot more'
        },
        {
          title: 'Seamless Bookings with In-profile calendar scheduling built-in'
        },
        {
          title: 'Never worry about monthly limits for Contact Shares'
        },
        {
          title: 'Stand out with our elite membership badge'
        },
        {
          title: 'Full-Color Customization',
          detail: 'Design your profile with expert selected color palette'
        },
        {
          title: 'Comma Insurance for a full year'},
        {
          title: '24/7 Priority Support'
        }
      ],
      ctaLabel: 'Start Elite – ₹299/mo'
    }
  ];
  
  module.exports = { plans };
  