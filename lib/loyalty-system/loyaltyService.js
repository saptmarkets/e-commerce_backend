const Customer = require('../../models/Customer');
const LoyaltyTransaction = require('../../models/LoyaltyTransaction');

class LoyaltyService {
  
  // Loyalty system configuration
  static config = {
    pointsPerSAR: 1, // 1 point per 1 SAR spent
    pointValue: 0.01, // 1 point = 0.01 SAR
    minimumRedemption: 100, // Minimum 100 points to redeem
    pointsExpiry: 365, // Points expire after 365 days
    bonusThresholds: [
      { amount: 500, bonus: 50 },   // 50 bonus points for orders over 500 SAR
      { amount: 1000, bonus: 150 }, // 150 bonus points for orders over 1000 SAR
      { amount: 2000, bonus: 400 }  // 400 bonus points for orders over 2000 SAR
    ]
  };

  /**
   * Calculate points earned from an order
   */
  static calculatePointsEarned(orderAmount) {
    const basePoints = Math.floor(orderAmount * this.config.pointsPerSAR);
    
    // Calculate bonus points based on order amount
    let bonusPoints = 0;
    for (const threshold of this.config.bonusThresholds) {
      if (orderAmount >= threshold.amount) {
        bonusPoints = threshold.bonus;
      }
    }
    
    return {
      basePoints,
      bonusPoints,
      totalPoints: basePoints + bonusPoints
    };
  }

  /**
   * Award points to customer after successful order
   */
  static async awardPoints(customerId, orderId, orderAmount) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const pointsCalculation = this.calculatePointsEarned(orderAmount);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.config.pointsExpiry);

      // Create base points transaction
      if (pointsCalculation.basePoints > 0) {
        await this.createTransaction({
          customer: customerId,
          type: 'earned',
          points: pointsCalculation.basePoints,
          description: `Earned ${pointsCalculation.basePoints} points from order #${orderId}`,
          order: orderId,
          balanceAfter: customer.loyaltyPoints.current + pointsCalculation.basePoints,
          expiryDate
        });
      }

      // Create bonus points transaction if applicable
      if (pointsCalculation.bonusPoints > 0) {
        await this.createTransaction({
          customer: customerId,
          type: 'bonus',
          points: pointsCalculation.bonusPoints,
          description: `Bonus ${pointsCalculation.bonusPoints} points for order over ${orderAmount} SAR`,
          order: orderId,
          balanceAfter: customer.loyaltyPoints.current + pointsCalculation.totalPoints,
          expiryDate
        });
      }

      // Update customer loyalty points
      await Customer.findByIdAndUpdate(customerId, {
        $inc: {
          'loyaltyPoints.current': pointsCalculation.totalPoints,
          'loyaltyPoints.total': pointsCalculation.totalPoints,
          'purchaseStats.totalOrders': 1,
          'purchaseStats.totalSpent': orderAmount
        },
        $set: {
          'purchaseStats.lastOrderDate': new Date(),
          'purchaseStats.averageOrderValue': await this.calculateAverageOrderValue(customerId, orderAmount)
        }
      });

      console.log(`Awarded ${pointsCalculation.totalPoints} loyalty points to customer ${customerId}`);
      
      return {
        success: true,
        pointsAwarded: pointsCalculation.totalPoints,
        breakdown: pointsCalculation
      };

    } catch (error) {
      console.error('Error awarding loyalty points:', error);
      throw error;
    }
  }

  /**
   * Redeem points for discount
   */
  static async redeemPoints(customerId, pointsToRedeem) {
    try {
      if (pointsToRedeem < this.config.minimumRedemption) {
        throw new Error(`Minimum ${this.config.minimumRedemption} points required for redemption`);
      }

      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (customer.loyaltyPoints.current < pointsToRedeem) {
        throw new Error('Insufficient loyalty points');
      }

      const discountAmount = pointsToRedeem * this.config.pointValue;

      // Create redemption transaction
      await this.createTransaction({
        customer: customerId,
        type: 'redeemed',
        points: -pointsToRedeem,
        description: `Redeemed ${pointsToRedeem} points for ${discountAmount} SAR discount`,
        balanceAfter: customer.loyaltyPoints.current - pointsToRedeem,
        redemptionDetails: {
          discountAmount,
          pointsUsed: pointsToRedeem
        }
      });

      // Update customer points
      await Customer.findByIdAndUpdate(customerId, {
        $inc: {
          'loyaltyPoints.current': -pointsToRedeem,
          'loyaltyPoints.used': pointsToRedeem
        }
      });

      return {
        success: true,
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        remainingPoints: customer.loyaltyPoints.current - pointsToRedeem
      };

    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  }

  /**
   * Get customer loyalty summary
   */
  static async getLoyaltySummary(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const recentTransactions = await LoyaltyTransaction.find({
        customer: customerId
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('order', 'invoice total createdAt');

      // Calculate points expiring soon (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringPoints = await LoyaltyTransaction.aggregate([
        {
          $match: {
            customer: customer._id,
            type: { $in: ['earned', 'bonus'] },
            status: 'active',
            expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
          }
        },
        {
          $group: {
            _id: null,
            totalExpiring: { $sum: '$points' }
          }
        }
      ]);

      return {
        customer: {
          name: customer.name,
          email: customer.email,
          loyaltyPoints: customer.loyaltyPoints,
          purchaseStats: customer.purchaseStats
        },
        pointsExpiringIn30Days: expiringPoints[0]?.totalExpiring || 0,
        recentTransactions,
        redemptionValue: customer.loyaltyPoints.current * this.config.pointValue,
        config: this.config
      };

    } catch (error) {
      console.error('Error getting loyalty summary:', error);
      throw error;
    }
  }

  /**
   * Get customer transaction history
   */
  static async getTransactionHistory(customerId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const transactions = await LoyaltyTransaction.find({
        customer: customerId
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('order', 'invoice total createdAt status');

      const totalTransactions = await LoyaltyTransaction.countDocuments({
        customer: customerId
      });

      return {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit),
          totalTransactions,
          hasNext: page < Math.ceil(totalTransactions / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Create a loyalty transaction record
   */
  static async createTransaction(transactionData) {
    try {
      const transaction = new LoyaltyTransaction(transactionData);
      await transaction.save();
      return transaction;
    } catch (error) {
      console.error('Error creating loyalty transaction:', error);
      throw error;
    }
  }

  /**
   * Calculate average order value for customer
   */
  static async calculateAverageOrderValue(customerId, newOrderAmount) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) return newOrderAmount;

      const currentTotal = customer.purchaseStats.totalSpent || 0;
      const currentOrders = customer.purchaseStats.totalOrders || 0;
      
      const newTotal = currentTotal + newOrderAmount;
      const newOrderCount = currentOrders + 1;
      
      return Math.round((newTotal / newOrderCount) * 100) / 100;
    } catch (error) {
      console.error('Error calculating average order value:', error);
      return 0;
    }
  }

  /**
   * Expire old points (to be run as a cron job)
   */
  static async expireOldPoints() {
    try {
      const now = new Date();
      
      // Find expired points
      const expiredTransactions = await LoyaltyTransaction.find({
        type: { $in: ['earned', 'bonus'] },
        status: 'active',
        expiryDate: { $lt: now }
      });

      for (const transaction of expiredTransactions) {
        // Mark transaction as expired
        await LoyaltyTransaction.findByIdAndUpdate(transaction._id, {
          status: 'expired'
        });

        // Create expiry transaction
        await this.createTransaction({
          customer: transaction.customer,
          type: 'expired',
          points: -transaction.points,
          description: `${transaction.points} points expired`,
          balanceAfter: 0 // Will be updated below
        });

        // Update customer balance
        await Customer.findByIdAndUpdate(transaction.customer, {
          $inc: {
            'loyaltyPoints.current': -transaction.points
          }
        });
      }

      console.log(`Expired ${expiredTransactions.length} point transactions`);
      return expiredTransactions.length;

    } catch (error) {
      console.error('Error expiring old points:', error);
      throw error;
    }
  }

  /**
   * Restore points when order is cancelled
   */
  static async restorePointsFromCancelledOrder(customerId, orderId, pointsToRestore) {
    try {
      console.log(`🔄 LOYALTY SERVICE: Starting restoration - Customer: ${customerId}, Order: ${orderId}, Points: ${pointsToRestore}`);
      
      const customer = await Customer.findById(customerId);
      if (!customer) {
        console.error(`❌ LOYALTY SERVICE: Customer ${customerId} not found`);
        throw new Error('Customer not found');
      }

      console.log(`📊 LOYALTY SERVICE: Customer before restoration:`, {
        current: customer.loyaltyPoints.current,
        total: customer.loyaltyPoints.total,
        used: customer.loyaltyPoints.used
      });

      const newBalance = customer.loyaltyPoints.current + pointsToRestore;

      // Create restoration transaction
      const transaction = await this.createTransaction({
        customer: customerId,
        type: 'refund',
        points: pointsToRestore,
        description: `Refunded ${pointsToRestore} points from cancelled order #${orderId}`,
        order: orderId,
        balanceAfter: newBalance
      });

      console.log(`📝 LOYALTY SERVICE: Created transaction:`, transaction._id);

      // Update customer points (restore the used points)
      const updateResult = await Customer.findByIdAndUpdate(
        customerId, 
        {
          $inc: {
            'loyaltyPoints.current': pointsToRestore,
            'loyaltyPoints.used': -pointsToRestore // Reduce the used count
          }
        },
        { new: true }
      );

      console.log(`📊 LOYALTY SERVICE: Customer after restoration:`, {
        current: updateResult.loyaltyPoints.current,
        total: updateResult.loyaltyPoints.total,
        used: updateResult.loyaltyPoints.used
      });

      console.log(`✅ LOYALTY SERVICE: Successfully restored ${pointsToRestore} points to customer ${customerId}`);

      return {
        success: true,
        pointsRestored: pointsToRestore,
        newBalance: updateResult.loyaltyPoints.current,
        transactionId: transaction._id
      };

    } catch (error) {
      console.error('💥 LOYALTY SERVICE: Error restoring loyalty points from cancelled order:', {
        error: error.message,
        stack: error.stack,
        customerId,
        orderId,
        pointsToRestore
      });
      return {
        success: false,
        error: error.message,
        pointsRestored: 0
      };
    }
  }

  /**
   * Remove earned points when order is cancelled (before delivery)
   */
  static async removeEarnedPointsFromCancelledOrder(customerId, orderId) {
    try {
      // Find transactions related to this order
      const orderTransactions = await LoyaltyTransaction.find({
        customer: customerId,
        order: orderId,
        type: { $in: ['earned', 'bonus'] },
        status: 'active'
      });

      if (orderTransactions.length === 0) {
        console.log('No earned points found for this order');
        return { success: true, pointsRemoved: 0 };
      }

      let totalPointsToRemove = 0;
      const customer = await Customer.findById(customerId);

      for (const transaction of orderTransactions) {
        totalPointsToRemove += transaction.points;
        
        // Mark the transaction as used/cancelled
        transaction.status = 'used';
        await transaction.save();
        
        // Create a removal transaction
        await this.createTransaction({
          customer: customerId,
          type: 'refund',
          points: -transaction.points,
          description: `Removed ${transaction.points} points from cancelled order #${orderId}`,
          order: orderId,
          balanceAfter: customer.loyaltyPoints.current - transaction.points
        });
      }

      // Update customer points
      await Customer.findByIdAndUpdate(customerId, {
        $inc: {
          'loyaltyPoints.current': -totalPointsToRemove,
          'loyaltyPoints.total': -totalPointsToRemove
        }
      });

      return {
        success: true,
        pointsRemoved: totalPointsToRemove,
        newBalance: customer.loyaltyPoints.current - totalPointsToRemove
      };

    } catch (error) {
      console.error('Error removing earned points from cancelled order:', error);
      throw error;
    }
  }
}

module.exports = LoyaltyService; 