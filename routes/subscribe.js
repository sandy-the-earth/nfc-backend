const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { plans } = require('../models/plan');
const Profile = require('../models/Profile');

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

// Simulated valid codes (in production, use a DB or admin tool)
const VALID_CODES = ['SIMU1234', 'SIMU5678', 'SIMU9999'];

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

// Activate subscription with code
router.post('/activate', async (req, res) => {
  try {
    const { profileId, plan, cycle, code } = req.body;
    if (!VALID_CODES.includes(code)) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.subscription = {
      plan,
      cycle,
      activatedAt: new Date(),
      code
    };
    await profile.save();
    res.json({ message: 'Subscription activated', subscription: profile.subscription });
  } catch (err) {
    console.error('Subscription activation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate subscription with code for the authenticated user
router.post('/activate-code', async (req, res) => {
  try {
    const { plan, cycle, code } = req.body;
    // You may want to use a real code validation system in production
    if (!VALID_CODES.includes(code)) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    // Assume req.user is set by authentication middleware
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const profile = await Profile.findOne({ ownerEmail: userEmail });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.subscription = {
      plan,
      cycle,
      activatedAt: new Date(),
      code
    };
    await profile.save();
    res.json({ message: 'Subscription activated', subscription: profile.subscription });
  } catch (err) {
    console.error('Subscription activation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Add or update a subscription for a profile
router.post('/add-subscription', async (req, res) => {
  try {
    const { profileId, plan, cycle, activatedAt, code } = req.body;
    if (!profileId || !plan || !cycle) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.subscription = {
      plan,
      cycle,
      activatedAt: activatedAt ? new Date(activatedAt) : new Date(),
      code: code || null
    };
    await profile.save();
    res.json({ message: 'Subscription added/updated', subscription: profile.subscription });
  } catch (err) {
    console.error('Add subscription error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Ensure all profiles have a subscription field
router.post('/ensure-subscription-field', async (req, res) => {
  try {
    const result = await Profile.updateMany(
      { subscription: { $exists: false } },
      {
        $set: {
          subscription: {
            plan: null,
            cycle: null,
            activatedAt: null,
            code: null
          }
        }
      }
    );
    res.json({ message: 'Subscription field ensured for all profiles', modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Ensure subscription field error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 