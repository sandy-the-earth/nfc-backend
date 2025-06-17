const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get subscription details
router.get('/:profileId', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ profileId: req.params.profileId });
    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update subscription
router.patch('/:profileId', adminAuth, async (req, res) => {
  try {
    const { plan, status, endDate, billingCycle, amount } = req.body;
    
    let subscription = await Subscription.findOne({ profileId: req.params.profileId });
    
    if (!subscription) {
      // Create new subscription
      subscription = new Subscription({
        profileId: req.params.profileId,
        plan,
        status,
        endDate,
        billingCycle,
        amount,
        paymentId: 'admin_manual' // Special identifier for admin-assigned subscriptions
      });
    } else {
      // Update existing subscription
      subscription.plan = plan;
      subscription.status = status;
      subscription.endDate = endDate;
      subscription.billingCycle = billingCycle;
      subscription.amount = amount;
    }

    await subscription.save();

    // Update profile's subscription plan
    await Profile.findByIdAndUpdate(req.params.profileId, {
      subscription: subscription._id,
      subscriptionPlan: plan
    });

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: List all subscriptions
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('profileId', 'name email')
      .sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get subscription statistics
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 