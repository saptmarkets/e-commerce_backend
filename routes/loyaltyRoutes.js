const express = require('express');
const router = express.Router();
const {
  getLoyaltySummary,
  getTransactionHistory,
  redeemPoints,
  getLoyaltyConfig,
  calculatePotentialPoints,
  getCustomerLoyaltyDetails,
  awardBonusPoints
} = require('../controller/loyaltyController');

const { isAuth, isAdmin } = require('../config/auth');

// Customer routes (require authentication)
router.get('/summary', isAuth, getLoyaltySummary);
router.get('/transactions', isAuth, getTransactionHistory);
router.post('/redeem', isAuth, redeemPoints);
router.get('/config', getLoyaltyConfig);
router.get('/calculate-points', calculatePotentialPoints);

// Admin routes (require admin authentication)
router.get('/customer/:customerId', isAdmin, getCustomerLoyaltyDetails);
router.post('/customer/:customerId/award-bonus', isAdmin, awardBonusPoints);

module.exports = router; 