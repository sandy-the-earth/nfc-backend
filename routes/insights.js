const express = require('express');
const router = express.Router();
const { getProfileInsights } = require('../utils/insights');

// GET /api/insights/:id
router.get('/:id', async (req, res, next) => {
  try {
    const insights = await getProfileInsights(req.params.id);
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
