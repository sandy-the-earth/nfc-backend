/**
 * Sends a standardized JSON response.
 *
 * @param {object} res - The Express response object.
 * @param {number} statusCode - The HTTP status code.
 * @param {object} data - The data to send in the response.
 * @param {string} message - A message to send in the response.
 */
const jsonResponse = (res, statusCode, data, message) => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};

/**
 * Normalizes the subscription object.
 * @param {object} subscription - The subscription object from the profile.
 * @returns {object} - The normalized subscription object.
 */
const normalizeSubscription = (subscription) => {
  if (!subscription || !subscription.plan || !subscription.activatedAt) {
    return {
      plan: null,
      cycle: null,
      activatedAt: null,
      expiresAt: null,
    };
  }

  const { plan, cycle, activatedAt } = subscription;
  let expiresAt = null;
  if (cycle && activatedAt) {
    const start = new Date(activatedAt);
    if (cycle === 'monthly') {
      expiresAt = new Date(start.setMonth(start.getMonth() + 1));
    } else if (cycle === 'quarterly') {
      expiresAt = new Date(start.setMonth(start.getMonth() + 3));
    }
  }

  return {
    plan,
    cycle,
    activatedAt: subscription.activatedAt,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  };
};

module.exports = {
  jsonResponse,
  normalizeSubscription,
};
