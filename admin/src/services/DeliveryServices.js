import httpService from "./httpService";

const DeliveryServices = {
  // Get order details for delivery with product checklist
  getOrderForDelivery: async (orderId) => {
    return httpService.get(`/delivery/order/${orderId}`);
  },

  // Start order processing (Pending -> Processing)
  startOrderProcessing: async (orderId, driverId = null) => {
    return httpService.post(`/delivery/order/${orderId}/start-processing`, {
      driverId
    });
  },

  // Mark individual product as collected/uncollected
  markProductCollected: async (orderId, productId, collected = true) => {
    return httpService.put(`/delivery/order/${orderId}/product/${productId}/collect`, {
      collected
    });
  },

  // Mark order as out for delivery (Processing -> Out for Delivery)
  markOutForDelivery: async (orderId) => {
    return httpService.post(`/delivery/order/${orderId}/out-for-delivery`);
  },

  // Complete delivery with verification code (Out for Delivery -> Delivered)
  completeDelivery: async (orderId, verificationCode) => {
    return httpService.post(`/delivery/order/${orderId}/complete`, {
      verificationCode
    });
  },

  // Get delivery statistics for admin dashboard
  getDeliveryStats: async () => {
    return httpService.get(`/admin/delivery/dashboard`);
  },

  // Get pending orders (not assigned to any driver)
  getPendingOrders: async (params = {}) => {
    return httpService.get(`/admin/delivery/orders/pending`, { params });
  },

  // Get available drivers
  getAvailableDrivers: async (params = {}) => {
    return httpService.get(`/admin/delivery/drivers/available`, { params });
  },

  // Get active drivers
  getActiveDrivers: async (params = {}) => {
    return httpService.get(`/admin/delivery/drivers`, { 
      params: { ...params, status: 'Active', isOnDuty: true } 
    });
  },

  // Assign order to driver
  assignOrderToDriver: async (data) => {
    return httpService.post(`/admin/delivery/orders/assign`, data);
  },

  // Reassign order to different driver
  reassignOrder: async (orderId, data) => {
    return httpService.put(`/admin/delivery/orders/${orderId}/reassign`, data);
  },

  // Get all drivers
  getAllDrivers: async (params = {}) => {
    return httpService.get(`/admin/delivery/drivers`, { params });
  },

  // Create new driver
  createDriver: async (data) => {
    return httpService.post(`/admin/delivery/drivers`, data);
  },

  // Update driver
  updateDriver: async (driverId, data) => {
    return httpService.put(`/admin/delivery/drivers/${driverId}`, data);
  },

  // Delete driver
  deleteDriver: async (driverId) => {
    return httpService.delete(`/admin/delivery/drivers/${driverId}`);
  },

  // Get delivery settings
  getDeliverySettings: async () => {
    return httpService.get(`/admin/delivery/settings`);
  },

  // Update delivery settings
  updateDeliverySettings: async (data) => {
    return httpService.put(`/admin/delivery/settings`, data);
  },

  // Auto-assign pending orders
  autoAssignPendingOrders: async () => {
    return httpService.post(`/admin/delivery/orders/auto-assign`);
  },

  // Get live tracking data
  getLiveTracking: async () => {
    return httpService.get(`/admin/delivery/tracking/live`);
  }
};

export default DeliveryServices; 