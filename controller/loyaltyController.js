const LoyaltyService = require('../lib/loyalty-system/loyaltyService');
const Customer = require('../models/Customer');

// Get customer loyalty summary
const getLoyaltySummary = async (req, res) => {
  try {
    const customerId = req.user._id;
    const summary = await LoyaltyService.getLoyaltySummary(customerId);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting loyalty summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get loyalty summary'
    });
  }
};

// Get loyalty transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await LoyaltyService.getTransactionHistory(
      customerId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transaction history'
    });
  }
};

// Redeem loyalty points
const redeemPoints = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { pointsToRedeem } = req.body;
    
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid points amount'
      });
    }
    
    const result = await LoyaltyService.redeemPoints(customerId, pointsToRedeem);
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Successfully redeemed ${pointsToRedeem} points`
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to redeem points'
    });
  }
};

// Get loyalty system configuration
const getLoyaltyConfig = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        config: LoyaltyService.config,
        description: {
          pointsPerSAR: 'Points earned per SAR spent',
          pointValue: 'SAR value per point when redeeming',
          minimumRedemption: 'Minimum points required to redeem',
          pointsExpiry: 'Days until points expire',
          bonusThresholds: 'Bonus points for order amounts'
        }
      }
    });
  } catch (error) {
    console.error('Error getting loyalty config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loyalty configuration'
    });
  }
};

// Calculate potential points for an order amount
const calculatePotentialPoints = async (req, res) => {
  try {
    const { orderAmount } = req.query;
    
    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount'
      });
    }
    
    const calculation = LoyaltyService.calculatePointsEarned(parseFloat(orderAmount));
    
    res.status(200).json({
      success: true,
      data: calculation
    });
  } catch (error) {
    console.error('Error calculating potential points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate potential points'
    });
  }
};

// Admin: Get customer loyalty details
const getCustomerLoyaltyDetails = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const summary = await LoyaltyService.getLoyaltySummary(customerId);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting customer loyalty details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer loyalty details'
    });
  }
};

// Admin: Award bonus points to customer
const awardBonusPoints = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { points, description } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid points amount'
      });
    }
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Create bonus transaction
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + LoyaltyService.config.pointsExpiry);
    
    await LoyaltyService.createTransaction({
      customer: customerId,
      type: 'bonus',
      points: points,
      description: description || `Admin awarded ${points} bonus points`,
      balanceAfter: customer.loyaltyPoints.current + points,
      expiryDate
    });
    
    // Update customer points
    await Customer.findByIdAndUpdate(customerId, {
      $inc: {
        'loyaltyPoints.current': points,
        'loyaltyPoints.total': points
      }
    });
    
    res.status(200).json({
      success: true,
      message: `Successfully awarded ${points} bonus points to customer`,
      data: {
        pointsAwarded: points,
        newBalance: customer.loyaltyPoints.current + points
      }
    });
  } catch (error) {
    console.error('Error awarding bonus points:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to award bonus points'
    });
  }
};

module.exports = {
  getLoyaltySummary,
  getTransactionHistory,
  redeemPoints,
  getLoyaltyConfig,
  calculatePotentialPoints,
  getCustomerLoyaltyDetails,
  awardBonusPoints
}; 