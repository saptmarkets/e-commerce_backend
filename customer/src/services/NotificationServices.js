import requests from "./httpServices";

const NotificationServices = {
  // Add notification (for admin use)
  addNotification: async (body, headers) => {
    return requests.post("/notification/add", body, headers);
  },

  // Get customer-specific notifications
  getAllNotifications: async (page = 1, limit = 10) => {
    return requests.get(`/notification/customer?page=${page}&limit=${limit}`);
  },

  // Get all notifications (old method - kept for backward compatibility)
  getAllNotificationsOld: async () => {
    return requests.get("/notification");
  },

  // Update notification status
  updateNotificationStatus: async (id, body) => {
    return requests.put(`/notification/${id}`, body);
  },

  // Update many notification status
  updateManyNotificationStatus: async (body) => {
    return requests.patch("/notification/update/many", body);
  },

  // Delete notification
  deleteNotification: async (id) => {
    return requests.delete(`/notification/${id}`);
  },

  // Delete many notifications
  deleteManyNotifications: async (body) => {
    return requests.patch("/notification/delete/many", body);
  },

  // Mark notification as read
  markAsRead: async (id) => {
    return requests.put(`/notification/${id}`, { status: "read" });
  },

  // Mark all notifications as read
  markAllAsRead: async (notificationIds) => {
    return requests.patch("/notification/update/many", {
      ids: notificationIds,
      status: "read"
    });
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await requests.get("/notification/customer?page=1&limit=1");
    return response.totalUnreadDoc || 0;
  },
};

export default NotificationServices;
