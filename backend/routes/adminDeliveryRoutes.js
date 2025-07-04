const express = require("express");
const router = express.Router();
const {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getPendingOrders,
  assignOrderToDriver,
  reassignOrder,
  getDeliveryDashboard,
  getAvailableDrivers,
  autoAssignPendingOrders,
  getDeliverySettings,
  updateDeliverySettings,
  getLiveTracking
} = require("../controller/adminDeliveryController");

// Authentication middleware
const { isAuth, isAdmin } = require("../config/auth");

// =====================================
// DRIVER MANAGEMENT ROUTES
// =====================================

// GET /api/admin/delivery/drivers - Get all drivers
router.get('/drivers', isAuth, isAdmin, getAllDrivers);

// POST /api/admin/delivery/drivers - Create new driver
router.post('/drivers', isAuth, isAdmin, createDriver);

// PUT /api/admin/delivery/drivers/:driverId - Update driver information
router.put('/drivers/:driverId', isAuth, isAdmin, updateDriver);

// DELETE /api/admin/delivery/drivers/:driverId - Delete/deactivate driver
router.delete('/drivers/:driverId', isAuth, isAdmin, deleteDriver);

// GET /api/admin/delivery/drivers/available - Get available drivers for assignment
router.get('/drivers/available', isAuth, isAdmin, getAvailableDrivers);

// =====================================
// ORDER ASSIGNMENT ROUTES
// =====================================

// GET /api/admin/delivery/orders/pending - Get pending orders (not assigned)
router.get('/orders/pending', isAuth, isAdmin, getPendingOrders);

// POST /api/admin/delivery/orders/assign - Assign order to driver
router.post('/orders/assign', isAuth, isAdmin, assignOrderToDriver);

// PUT /api/admin/delivery/orders/:orderId/reassign - Reassign order to different driver
router.put('/orders/:orderId/reassign', isAuth, isAdmin, reassignOrder);

// =====================================
// ANALYTICS & MONITORING ROUTES
// =====================================

// GET /api/admin/delivery/dashboard - Get delivery dashboard statistics
router.get('/dashboard', isAuth, isAdmin, getDeliveryDashboard);

// POST /api/admin/delivery/orders/auto-assign - Auto assign pending orders
router.post('/orders/auto-assign', isAuth, isAdmin, autoAssignPendingOrders);

// GET /api/admin/delivery/settings - Get delivery settings
router.get('/settings', isAuth, isAdmin, getDeliverySettings);

// PUT /api/admin/delivery/settings - Update delivery settings
router.put('/settings', isAuth, isAdmin, updateDeliverySettings);

// GET /api/admin/delivery/tracking/live - Get live tracking data
router.get('/tracking/live', isAuth, isAdmin, getLiveTracking);

module.exports = router; 