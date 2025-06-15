const express = require('express');
const router = express.Router();
const { plans } = require('../models/plan');

router.get('/', (req, res) => {
  res.json(plans);
});

module.exports = router;
