import requests from './httpService';

const PromotionListServices = {
  // Get all promotion lists with pagination
  getAllPromotionLists: async ({ page = 1, limit = 10, type, isActive } = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) searchParams.append('type', type);
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());
    
    return requests.get(`/promotion-lists?${searchParams.toString()}`);
  },

  // Get active promotion lists for selection
  getActivePromotionLists: async (type = null) => {
    const searchParams = new URLSearchParams();
    if (type) searchParams.append('type', type);
    
    return requests.get(`/promotion-lists/active?${searchParams.toString()}`);
  },

  // Get promotion list by ID
  getPromotionListById: async (id) => {
    return requests.get(`/promotion-lists/${id}`);
  },

  // Add new promotion list
  addPromotionList: async (promotionListData) => {
    return requests.post('/promotion-lists', promotionListData);
  },

  // Update promotion list
  updatePromotionList: async (id, promotionListData) => {
    return requests.put(`/promotion-lists/${id}`, promotionListData);
  },

  // Delete promotion list
  deletePromotionList: async (id) => {
    return requests.delete(`/promotion-lists/${id}`);
  },

  // Delete multiple promotion lists
  deleteManyPromotionLists: async (ids) => {
    return requests.delete('/promotion-lists/bulk/delete', { ids });
  },

  // Update promotion list status
  updatePromotionListStatus: async (id, isActive) => {
    return requests.put(`/promotion-lists/status/${id}`, { isActive });
  },
};

export default PromotionListServices; 