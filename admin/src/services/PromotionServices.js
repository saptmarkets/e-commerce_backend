import axios from 'axios';
import { toast } from 'react-hot-toast';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5055';
console.log('API Base URL for promotions:', API_BASE_URL);

// Create a base URL that doesn't have double /api/
const getApiUrl = (endpoint) => {
  // Remove any leading slash from endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // If API_BASE_URL already contains /api, don't add it again
  if (API_BASE_URL.includes('/api')) {
    return `${API_BASE_URL}/${cleanEndpoint}`;
  } else {
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
  }
};

// Helper function to test an endpoint
const testEndpoint = async (url) => {
  try {
    console.log(`Testing endpoint: ${url}`);
    const start = Date.now();
    const response = await axios.get(url, { timeout: 5000 });
    const duration = Date.now() - start;
    
    console.log(`Endpoint ${url} responded in ${duration}ms with status ${response.status}`);
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      duration,
      data: response.data
    };
  } catch (error) {
    console.error(`Endpoint test failed for ${url}:`, error.message);
    return {
      success: false,
      status: error.response?.status || 0,
      message: error.message,
      code: error.code
    };
  }
};

// Initialize by testing the API connection on module load
(async () => {
  console.log('Initializing PromotionServices and testing API connection...');
  try {
    const testUrl = getApiUrl(`promotions?limit=1&_=${Date.now()}`);
    const result = await testEndpoint(testUrl);
    if (result.success) {
      console.log('API connection initialized successfully');
    } else {
      console.warn('Initial API connection test failed, but service will retry on actual requests');
    }
  } catch (error) {
    console.warn('Error during API initialization:', error.message);
  }
})();

const PromotionServices = {
  getAllPromotions: async (params = {}) => {
    try {
      const { page = 1, limit = 15, status = '', query = '', promotionList = '' } = params;
      
      // Add cache-busting parameter
      const cacheBuster = `_t=${Date.now()}`;
      
      // Build the query string
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (status) queryParams.append('status', status);
      if (query) queryParams.append('query', query);
      if (promotionList) queryParams.append('promotionList', promotionList);
      queryParams.append('_t', Date.now()); // Cache busting
      
      const apiPath = getApiUrl('promotions');
      const url = `${apiPath}?${queryParams.toString()}`;
      
      console.log(`Fetching promotions from: ${url}`);
      const response = await axios.get(url);
      console.log('API response received:', response.status);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      
      // Try direct API call as fallback
      try {
        console.log('Attempting direct API call without /api prefix...');
        const { page = 1, limit = 15, status = '', promotionList = '' } = params;
        
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', limit);
        if (status) queryParams.append('status', status);
        if (promotionList) queryParams.append('promotionList', promotionList);
        queryParams.append('_t', Date.now());
        
        const directUrl = `${getApiUrl('promotions')}?${queryParams.toString()}`;
        console.log(`Direct API call to: ${directUrl}`);
        
        const directResponse = await axios.get(directUrl);
        console.log('Direct API call succeeded:', directResponse.status);
        return directResponse.data;
      } catch (directError) {
        console.error('Direct API call failed:', directError.message);
        
        // Return a user-friendly error message
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch promotions';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
  },

  getPromotionById: async (id) => {
    try {
      const apiPath = getApiUrl(`promotions/${id}`);
      const response = await axios.get(apiPath);
      return response.data;
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
      const apiPath = getApiUrl('promotions');
      const response = await axios.post(apiPath, promotion);
      toast.success('Promotion added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding promotion:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add promotion';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  updatePromotion: async (id, promotion) => {
    try {
      const apiPath = getApiUrl(`promotions/${id}`);
      const response = await axios.put(apiPath, promotion);
      toast.success('Promotion updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating promotion:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to update promotion with ID: ${id}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  deletePromotion: async (id) => {
    try {
      const apiPath = getApiUrl(`promotions/${id}`);
      const response = await axios.delete(apiPath);
      toast.success('Promotion deleted successfully');
      return response.data;
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
      const apiPath = getApiUrl(`promotions/status/${id}`);
      return await axios.put(apiPath, { status });
    } catch (error) {
      console.error(`Error updating promotion ${id} status:`, error);
      throw error;
    }
  },

  deleteManyPromotions: async (ids) => {
    try {
      console.log(`Deleting promotions: ${ids.join(', ')}`);
      const apiPath = getApiUrl('promotions/bulk/delete');
      return await axios.delete(apiPath, { data: { ids } });
    } catch (error) {
      console.error('Error deleting promotions:', error);
      throw error;
    }
  },

  getActivePromotions: async () => {
    try {
      // Add cache busting parameter
      const params = new URLSearchParams();
      params.append('_t', Date.now());
      
      console.log('Fetching active promotions');
      const apiPath = getApiUrl(`promotions/active?${params.toString()}`);
      const response = await axios.get(apiPath);
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
      const apiPath = getApiUrl('promotions/import');
      return await axios.post(apiPath, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Error importing promotions:', error);
      throw error;
    }
  },
  
  exportPromotions: async () => {
    try {
      console.log('Exporting promotions');
      const apiPath = getApiUrl('promotions/export');
      return await axios.get(apiPath);
    } catch (error) {
      console.error('Error exporting promotions:', error);
      throw error;
    }
  },

  getPromotion: async (id) => {
    try {
      const apiPath = getApiUrl(`promotions/${id}`);
      const response = await axios.get(apiPath);
      console.log('Single promotion API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching promotion:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to fetch promotion with ID: ${id}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
};

export default PromotionServices; 