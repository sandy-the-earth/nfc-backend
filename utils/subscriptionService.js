const Subscription = require('../models/Subscription');
const Profile = require('../models/Profile');

class SubscriptionService {
  static async createSubscription(profileId, plan, billingCycle) {
    const plans = {
      novice: { monthly: 99, quarterly: 199 },
      corporate: { monthly: 199, quarterly: 399 },
      elite: { monthly: 299, quarterly: 599 }
    };

    const amount = plans[plan][billingCycle];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingCycle === 'quarterly' ? 3 : 1));

    const subscription = new Subscription({
      profileId,
      plan,
      billingCycle,
      amount,
      endDate,
      paymentId: 'admin_manual'
    });

    await subscription.save();

    await Profile.findByIdAndUpdate(profileId, {
      subscription: subscription._id,
      subscriptionPlan: plan
    });

    return subscription;
  }

  static async checkSubscriptionStatus(profileId) {
    const subscription = await Subscription.findOne({ profileId });
    if (!subscription) return false;

    if (subscription.status !== 'active') return false;
    if (new Date() > subscription.endDate) {
      subscription.status = 'expired';
      await subscription.save();
      return false;
    }

    return true;
  }
}

module.exports = SubscriptionService; 