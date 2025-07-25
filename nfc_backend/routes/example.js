// routes/example.js - Example usage of the middleware
const express = require('express');
const router = express.Router();
const loadProfileNoTracking = require('../middleware/loadProfileNoTracking');
const planGate = require('../middleware/planGate');

// Example: Get profile preview (no view tracking)
router.get('/preview/:activationCode', loadProfileNoTracking, planGate, (req, res) => {
  res.json(res.locals.filteredProfile);
});

// Example: Get profile with additional data
router.get('/extended/:activationCode', loadProfileNoTracking, planGate, (req, res) => {
  const filteredProfile = res.locals.filteredProfile;
  
  // Add additional data to the response
  const extendedProfile = {
    ...filteredProfile,
    additionalInfo: {
      lastUpdated: new Date(),
      version: '1.0'
    }
  };
  
  res.json(extendedProfile);
});

module.exports = router; 