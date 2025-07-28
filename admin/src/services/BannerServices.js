import requests from './httpService';

const BannerServices = {
  // Get all banners with pagination and filters
  getAllBanners: async ({ page = 1, limit = 8, title = '', sort = '', location = '' }) => {
    const searchTitle = title !== null ? title : '';
    return requests.get(
      `/admin/banners?page=${page}&limit=${limit}&title=${searchTitle}&sort=${sort}&location=${location}`
    );
  },

  // Get banner by ID
  getBannerById: async (id) => {
    return requests.get(`/admin/banners/${id}`);
  },

  // Add new banner
  addBanner: async (body) => {
    return requests.post('/admin/banners', body);
  },

  // Update banner
  updateBanner: async (id, body) => {
    return requests.put(`/admin/banners/${id}`, body);
  },

  // Delete banner
  deleteBanner: async (id) => {
    return requests.delete(`/admin/banners/${id}`);
  },

  // Bulk delete banners
  deleteManyBanners: async (body) => {
    return requests.patch('/admin/banners/delete/many', body);
  },

  // Update banner status
  updateStatus: async (id, body) => {
    return requests.put(`/admin/banners/status/${id}`, body);
  },

  // Get banners by location
  getBannersByLocation: async (location) => {
    return requests.get(`/banners/location/${location}`);
  },

  // Get active banners for frontend
  getActiveBanners: async () => {
    return requests.get('/banners/active');
  },

  // Update banner sort order
  updateSortOrder: async (banners) => {
    return requests.patch('/admin/banners/sort-order', { banners });
  },
};

export default BannerServices; 