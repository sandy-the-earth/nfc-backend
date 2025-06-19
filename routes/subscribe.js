const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { plans } = require('../models/plan');

// Helper to get price from plans array
function getPrice(planId, cycle) {
  const plan = plans.find(p => p.id === planId);
  if (!plan || !plan.prices[cycle]) return null;
  return plan.prices[cycle];
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/session', async (req, res) => {
  try {
    const { plan, cycle } = req.body;
    const price = getPrice(plan, cycle);
    if (!price) {
      return res.status(400).json({ message: 'Invalid plan or cycle' });
    }

    // Razorpay expects amount in paise
    const amount = price * 100;
    const currency = 'INR';
    const receipt = `receipt_${plan}_${cycle}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: 1,
      notes: {
        plan,
        cycle
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      receipt: order.receipt
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 