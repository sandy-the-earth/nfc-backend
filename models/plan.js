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
    features: ['Feature A', 'Feature B', 'Feature C']
  },
  {
    id: 'corporate',
    name: 'Corporate',
    prices: { monthly: 199, quarterly: 399 },
    features: ['Feature A', 'Feature B', 'Feature C']
  },
  {
    id: 'elite',
    name: 'Elite',
    prices: { monthly: 299, quarterly: 599 },
    features: ['Feature A', 'Feature B', 'Feature C']
  },
];

module.exports = { plans };
