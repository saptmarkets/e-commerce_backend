import requests from './httpServices';

const BannerServices = {
  // Get banners by location
  getBannersByLocation: async (location) => {
    return requests.get(`/banners/location/${location}`);
  },

  // Get all active banners
  getActiveBanners: async () => {
    return requests.get('/banners/active');
  },

  // Track banner click
  trackBannerClick: async (bannerId) => {
    return requests.post(`/banners/track/click/${bannerId}`);
  },

  // Track banner impression
  trackBannerImpression: async (bannerId) => {
    return requests.post(`/banners/track/impression/${bannerId}`);
  },
};

export default BannerServices; 