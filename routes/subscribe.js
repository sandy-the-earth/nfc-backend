const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const { plans } = require('../models/plan');

// Helper to get price from plans array
function getPrice(planId, cycle) {
  const plan = plans.find(p => p.id === planId);
  if (!plan || !plan.prices[cycle]) return null;
  return plan.prices[cycle];
}

router.post('/session', async (req, res) => {
  try {
    const { plan, cycle } = req.body;
    const price = getPrice(plan, cycle);
    if (!price) {
      return res.status(400).json({ message: 'Invalid plan or cycle' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'inr',
          unit_amount: price * 100, // Stripe expects amount in paise
          product_data: {
            name: `${plan} (${cycle})`,
          },
        },
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/plans`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 