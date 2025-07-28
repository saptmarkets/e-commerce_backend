import requests from "./httpService";
import { toast } from 'react-hot-toast';



const PromotionServices = {
  getAllPromotions: async (params = {}) => {
    try {
      const { page = 1, limit = 15, status = '', query = '', promotionList = '' } = params;
      
      // Build query parameters
      const queryParams = {};
      if (page) queryParams.page = page;
      if (limit) queryParams.limit = limit;
      if (status) queryParams.status = status;
      if (query) queryParams.query = query;
      if (promotionList) queryParams.promotionList = promotionList;
      queryParams._t = Date.now(); // Cache busting
      
      console.log(`Fetching promotions with params:`, queryParams);
      const response = await requests.get('/promotions', queryParams);
      console.log('Promotions API response received');
      
      return response;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch promotions';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  getPromotionById: async (id) => {
    try {
      const response = await requests.get(`/promotions/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching promotion by ID:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to fetch promotion with ID: ${id}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  addPromotion: async (promotion) => {
    console.log('Creating promotion with data:', JSON.stringify(promotion, null, 2));
    try {
      const response = await requests.post('/promotions', promotion);
      toast.success('Promotion added successfully');
      return response;
    } catch (error) {
      console.error('Error adding promotion:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add promotion';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  updatePromotion: async (id, promotion) => {
    try {
      const response = await requests.put(`/promotions/${id}`, promotion);
      toast.success('Promotion updated successfully');
      return response;
    } catch (error) {
      console.error('Error updating promotion:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to update promotion with ID: ${id}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  deletePromotion: async (id) => {
    try {
      const response = await requests.delete(`/promotions/${id}`);
      toast.success('Promotion deleted successfully');
      return response;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to delete promotion with ID: ${id}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  updatePromotionStatus: async (id, status) => {
    try {
      console.log(`Updating promotion ${id} status to ${status}`);
      return await requests.put(`/promotions/status/${id}`, { status });
    } catch (error) {
      console.error(`Error updating promotion ${id} status:`, error);
      throw error;
    }
  },

  deleteManyPromotions: async (ids) => {
    try {
      console.log(`Deleting promotions: ${ids.join(', ')}`);
      return await requests.delete('/promotions/bulk/delete', { ids });
    } catch (error) {
      console.error('Error deleting promotions:', error);
      throw error;
    }
  },

  getActivePromotions: async () => {
    try {
      console.log('Fetching active promotions');
      const response = await requests.get('/promotions/active', { _t: Date.now() });
      console.log('getActivePromotions response:', response);
      
      // Ensure we always have an array
      if (!response) {
        console.warn('Active promotions response is empty');
        return [];
      }
      
      if (!Array.isArray(response)) {
        console.warn('Active promotions response is not an array:', response);
        return Array.isArray(response.promotions) ? response.promotions : [];
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  },
  
  importPromotions: async (formData) => {
    try {
      console.log('Importing promotions');
      return await requests.post('/promotions/import', formData);
    } catch (error) {
      console.error('Error importing promotions:', error);
      throw error;
    }
  },
  
  exportPromotions: async () => {
    try {
      console.log('Exporting promotions');
      return await requests.get('/promotions/export');
    } catch (error) {
      console.error('Error exporting promotions:', error);
      throw error;
    }
  },

  getPromotion: async (id) => {
    try {
      const response = await requests.get(`/promotions/${id}`);
      console.log('Single promotion API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching promotion:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to fetch promotion with ID: ${id}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
};

export default PromotionServices; 