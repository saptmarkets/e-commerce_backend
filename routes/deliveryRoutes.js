const express = require("express");
const router = express.Router();
const {
  getOrderForDelivery,
  startOrderProcessing,
  markProductCollected,
  markOutForDelivery,
  completeDelivery,
  getDeliveryStats
} = require("../controller/deliveryController");

// Middleware for authentication (using existing admin auth)
const { isAuth, isAdmin } = require("../config/auth");

// Get order details for delivery with product checklist
router.get("/order/:orderId", isAuth, isAdmin, getOrderForDelivery);

// Start order processing (Pending -> Processing)
router.post("/order/:orderId/start-processing", isAuth, isAdmin, startOrderProcessing);

// Mark individual product as collected/uncollected
router.put("/order/:orderId/product/:productId/collect", isAuth, isAdmin, markProductCollected);

// Mark order as out for delivery (Processing -> Out for Delivery)
router.post("/order/:orderId/out-for-delivery", isAuth, isAdmin, markOutForDelivery);

// Complete delivery with verification code (Out for Delivery -> Delivered)
router.post("/order/:orderId/complete", isAuth, isAdmin, completeDelivery);

// Get delivery statistics for admin dashboard
router.get("/stats", isAuth, isAdmin, getDeliveryStats);

module.exports = router; 