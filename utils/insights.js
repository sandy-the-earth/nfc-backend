const Profile = require('../models/Profile');

/**
 * Get the contact exchange limit for a given plan.
 * @param {string} plan - The subscription plan.
 * @returns {number|Infinity} - The contact exchange limit.
 */
const getContactLimit = (plan) => {
  switch (plan) {
    case 'Novice':
      return 20;
    case 'Corporate':
      return 50;
    case 'Elite':
      return Infinity;
    default:
      return 0;
  }
};

/**
 * Get the visibility settings for insights based on the subscription plan.
 * @param {string} plan - The subscription plan.
 * @returns {object} - The insight visibility settings.
 */
const getInsightVisibility = (plan) => {
  const isElite = plan === 'Elite';
  const isCorporate = plan === 'Corporate';

  return {
    totalViews: true,
    uniqueVisitors: true,
    contactExchanges: true,
    contactExchangeLimit: true,
    contactExchangeRemaining: true,
    contactSaves: true,
    contactDownloads: isCorporate || isElite,
    viewCountsOverTime: true,
    detailedViewCountsOverTime: isCorporate || isElite,
    lastViewedAt: isElite,
    totalLinkTaps: isElite,
    topLink: isElite,
    createdAt: isElite,
    updatedAt: isElite,
    subscription: true,
    viewsByIndustry: isCorporate || isElite,
  };
};

/**
 * Get insights for a profile using MongoDB aggregation.
 * @param {string} profileId - The ID of the profile.
 * @returns {Promise<object>} - The profile insights.
 */
const getProfileInsights = async (profileId) => {
  const profile = await Profile.findById(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  if (!profile.insightsEnabled) {
    return {
      message: 'Insights are not enabled for this profile.',
    };
  }

  const plan = profile.subscription?.plan || 'Novice';

  const aggregationPipeline = [
    { $match: { _id: profile._id } },
    {
      $project: {
        totalViews: { $size: '$views' },
        uniqueVisitors: { $size: { $setUnion: '$views.ip' } },
        contactSaves: '$contactSaves',
        contactDownloads: '$contactDownloads',
        lastViewedAt: '$lastViewedAt',
        createdAt: '$createdAt',
        updatedAt: '$updatedAt',
        views: '$views',
        linkClicks: '$linkClicks',
        contactExchanges: '$contactExchanges',
      },
    },
    {
      $addFields: {
        viewCountsOverTime: {
          $map: {
            input: {
              $map: {
                input: '$views',
                as: 'view',
                in: {
                  date: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$$view.date',
                    },
                  },
                },
              },
            },
            as: 'view',
            in: {
              date: '$$view.date',
              count: 1,
            },
          },
        },
        viewsByIndustry: {
          $cond: {
            if: { $in: [plan, ['Corporate', 'Elite']] },
            then: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: '$views.industry' },
                  as: 'industry',
                  in: {
                    k: '$$industry',
                    v: {
                      $size: {
                        $filter: {
                          input: '$views',
                          as: 'view',
                          cond: { $eq: ['$$view.industry', '$$industry'] },
                        },
                      },
                    },
                  },
                },
              },
            },
            else: '$$REMOVE',
          },
        },
      },
    },
    {
      $addFields: {
        totalLinkTaps: {
          $reduce: {
            input: { $objectToArray: '$linkClicks' },
            initialValue: 0,
            in: { $add: ['$$value', '$$this.v'] },
          },
        },
      },
    },
  ];

  const [insights] = await Profile.aggregate(aggregationPipeline);

  const limit = getContactLimit(plan);
  const used = insights.contactExchanges?.count || 0;
  const remaining = limit === Infinity ? 'Unlimited' : Math.max(0, limit - used);

  const topLink = Object.entries(insights.linkClicks || {}).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ['', 0]
  )[0];

  return {
    ...insights,
    totalViews: insights.totalViews,
    uniqueVisitors: insights.uniqueVisitors,
    contactExchanges: used,
    contactExchangeLimit: limit,
    contactExchangeRemaining: remaining,
    topLink,
    insightVisibility: getInsightVisibility(plan),
  };
};

module.exports = {
  getProfileInsights,
};
