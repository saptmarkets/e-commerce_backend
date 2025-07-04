import requests from "./httpService";

const LoyaltyServices = {
  // Get customer loyalty details (admin view)
  getCustomerLoyaltyDetails: async (customerId) => {
    try {
      const response = await requests.get(`/loyalty/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer loyalty details:', error);
      throw error;
    }
  },

  // Award bonus points to customer (admin only)
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

  // Get all customers with loyalty data (for admin dashboard)
  getAllCustomersLoyalty: async (page = 1, limit = 20) => {
    try {
      const response = await requests.get(`/customers?page=${page}&limit=${limit}&includeLoyalty=true`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customers loyalty data:', error);
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

  // Get loyalty system analytics
  getLoyaltyAnalytics: async () => {
    try {
      const response = await requests.get('/loyalty/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty analytics:', error);
      throw error;
    }
  },

  // Update loyalty system configuration (admin only)
  updateLoyaltyConfig: async (config) => {
    try {
      const response = await requests.put('/loyalty/config', config);
      return response.data;
    } catch (error) {
      console.error('Error updating loyalty config:', error);
      throw error;
    }
  },

  // Get loyalty transactions for a specific date range
  getLoyaltyTransactionsByDate: async (startDate, endDate, page = 1, limit = 20) => {
    try {
      const response = await requests.get(`/loyalty/transactions/date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty transactions by date:', error);
      throw error;
    }
  },

  // Expire points for a specific customer (admin only)
  expireCustomerPoints: async (customerId, points, reason) => {
    try {
      const response = await requests.post(`/loyalty/customer/${customerId}/expire-points`, {
        points,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error expiring customer points:', error);
      throw error;
    }
  },

  // Get loyalty leaderboard
  getLoyaltyLeaderboard: async (limit = 10) => {
    try {
      const response = await requests.get(`/loyalty/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty leaderboard:', error);
      throw error;
    }
  }
};

export default LoyaltyServices; 