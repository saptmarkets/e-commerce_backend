import requests from "./httpServices";

const LoyaltyServices = {
  // Get customer loyalty summary
  getLoyaltySummary: async () => {
    try {
      const response = await requests.get('/loyalty/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty summary:', error);
      throw error;
    }
  },

  // Get loyalty transaction history
  getTransactionHistory: async (page = 1, limit = 20) => {
    try {
      const response = await requests.get(`/loyalty/transactions?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  },

  // Redeem loyalty points
  redeemPoints: async (pointsToRedeem) => {
    try {
      const response = await requests.post('/loyalty/redeem', {
        pointsToRedeem
      });
      return response.data;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  },

  // Get loyalty system configuration
  getLoyaltyConfig: async () => {
    try {
      const response = await requests.get('/loyalty/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty config:', error);
      throw error;
    }
  },

  // Calculate potential points for order amount
  calculatePotentialPoints: async (orderAmount) => {
    try {
      const response = await requests.get(`/loyalty/calculate-points?orderAmount=${orderAmount}`);
      return response.data;
    } catch (error) {
      console.error('Error calculating potential points:', error);
      throw error;
    }
  },

  // Admin: Get customer loyalty details
  getCustomerLoyaltyDetails: async (customerId) => {
    try {
      const response = await requests.get(`/loyalty/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer loyalty details:', error);
      throw error;
    }
  },

  // Admin: Award bonus points to customer
  awardBonusPoints: async (customerId, points, description) => {
    try {
      const response = await requests.post(`/loyalty/customer/${customerId}/award-bonus`, {
        points,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error awarding bonus points:', error);
      throw error;
    }
  }
};

export default LoyaltyServices; 