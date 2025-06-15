const express = require('express');
const router = express.Router();

// Mock data for plans
const plans = [
    {
        id: 'basic',
        name: 'Basic Plan',
        prices: { monthly: 99, quarterly: 199 },
        features: ['Feature 1', 'Feature 2', 'Feature 3']
    },
    {
        id: 'pro',
        name: 'Pro Plan',
        prices: { monthly: 199, quarterly: 399 },
        features: ['Feature A', 'Feature B', 'Feature C']
    },
    {
        id: 'enterprise',
        name: 'Enterprise Plan',
        prices: { monthly: 299, quarterly: 599 },
        features: ['Feature X', 'Feature Y', 'Feature Z']
    }
];

// Endpoint to fetch plans
router.get('/plans', (req, res) => {
    res.json(plans);
});

module.exports = router;
