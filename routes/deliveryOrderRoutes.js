const express = require("express");
const router = express.Router();
const {
  getAssignedOrders,
  getOrderDetails,
  updateOrderStatus,
  markAsPickedUp,
  markOutForDelivery,
  markAsDelivered,
  markAsFailed,
  toggleProductCollection,
  regenerateProductChecklist,
  checkOrderAssignment
} = require("../controller/deliveryOrderController");

// Authentication middleware
const { isAuth } = require("../config/auth");

// Custom middleware to verify driver role
const isDriver = async (req, res, next) => {
  try {
    const Admin = require("../models/Admin");
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const driver = await Admin.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (driver.role !== "Driver") {
      return res.status(403).json({ message: "Access denied. Driver role required." });
    }
    
    req.driver = driver;
    next();
  } catch (error) {
    console.error('Driver verification error:', error);
    res.status(500).json({ message: "Authentication error", error: error.message });
  }
};

// =====================================
// ORDER MANAGEMENT ROUTES
// =====================================

// GET /api/delivery-orders/assigned - Get orders assigned to driver
router.get('/assigned', isAuth, isDriver, getAssignedOrders);

// GET /api/delivery-orders/:orderId - Get detailed order information
router.get('/:orderId', isAuth, isDriver, getOrderDetails);

// GET /api/delivery-orders/:orderId/check-assignment - Debug: Check order assignment
router.get('/:orderId/check-assignment', isAuth, isDriver, checkOrderAssignment);

// PUT /api/delivery-orders/:orderId/status - Update order status
router.put('/:orderId/status', isAuth, isDriver, updateOrderStatus);

// =====================================
// DELIVERY ACTION ROUTES
// =====================================

// POST /api/delivery-orders/:orderId/toggle-product - Toggle product collection status
router.post('/:orderId/toggle-product', isAuth, isDriver, toggleProductCollection);

// POST /api/delivery-orders/:orderId/regenerate-checklist - Regenerate product checklist
router.post('/:orderId/regenerate-checklist', isAuth, isDriver, regenerateProductChecklist);

// POST /api/delivery-orders/:orderId/pick-up - Mark order as picked up
router.post('/:orderId/pick-up', isAuth, isDriver, markAsPickedUp);

// POST /api/delivery-orders/:orderId/out-for-delivery - Mark out for delivery
router.post('/:orderId/out-for-delivery', isAuth, isDriver, markOutForDelivery);

// POST /api/delivery-orders/:orderId/delivered - Mark as delivered with verification
router.post('/:orderId/delivered', isAuth, isDriver, markAsDelivered);

// POST /api/delivery-orders/:orderId/failed - Mark delivery as failed
router.post('/:orderId/failed', isAuth, isDriver, markAsFailed);

module.exports = router; 