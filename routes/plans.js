const express = require('express');
const router = express.Router();

// Plans and pricing data
const plans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    prices: { monthly: 199, quarterly: 499 },
    features: ['Feature 1', 'Feature 2', 'Feature 3']
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    prices: { monthly: 499, quarterly: 1299 },
    features: ['Feature A', 'Feature B', 'Feature C']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    prices: { monthly: 999, quarterly: 2499 },
    features: ['Feature X', 'Feature Y', 'Feature Z']
  }
];

// GET /api/plans
router.get('/', (req, res) => {
  res.json(plans);
});

module.exports = router;
