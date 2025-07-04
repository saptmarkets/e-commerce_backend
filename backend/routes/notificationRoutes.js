const express = require("express");
const router = express.Router();
const {
  getAllNotification,
  addNotification,
  updateStatusNotification,
  deleteNotificationById,
  deleteNotificationByProductId,
  deleteManyNotification,
  updateManyStatusNotification,
  getCustomerNotifications,
  createCustomerNotification,
  createGlobalNotification,
} = require("../controller/notificationController");

const { isAuth, isAdmin, isCustomer, requireCustomerAuth } = require("../config/auth");

// Admin notification routes (require admin authentication)
router.post("/add", isAuth, isAdmin, addNotification);
router.get("/", isAuth, isAdmin, getAllNotification);
router.post("/global", isAuth, isAdmin, createGlobalNotification);

// Customer-specific notification routes (require customer authentication)
router.get("/customer", isCustomer, getCustomerNotifications);
router.post("/customer", isAuth, isAdmin, createCustomerNotification); // Only admins can create customer notifications

// Shared routes (can be used by both admin and customer)
router.put("/:id", isCustomer, updateStatusNotification);
router.patch("/update/many", isCustomer, updateManyStatusNotification);
router.delete("/:id", isCustomer, deleteNotificationById);
router.patch("/delete/many", isCustomer, deleteManyNotification);

// Admin-only routes
router.delete("/product-id/:id", isAuth, isAdmin, deleteNotificationByProductId);

module.exports = router;
