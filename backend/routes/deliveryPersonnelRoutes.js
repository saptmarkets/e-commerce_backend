const express = require("express");
const router = express.Router();
const {
  deliveryLogin,
  getDeliveryProfile,
  updateDeliveryProfile,
  updateCurrentLocation,
  clockIn,
  clockOut,
  getShiftStatus,
  getDeliveryStats,
  getDailyEarnings
} = require("../controller/deliveryPersonnelController");

// Authentication middleware (for drivers)
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
// AUTHENTICATION ROUTES
// =====================================

// POST /api/delivery-personnel/login - Driver login
router.post('/login', deliveryLogin);

// =====================================
// PROFILE MANAGEMENT ROUTES
// =====================================

// GET /api/delivery-personnel/profile - Get driver profile
router.get('/profile', isAuth, isDriver, getDeliveryProfile);

// PUT /api/delivery-personnel/profile - Update driver profile
router.put('/profile', isAuth, isDriver, updateDeliveryProfile);

// POST /api/delivery-personnel/location - Update current location
router.post('/location', isAuth, isDriver, updateCurrentLocation);

// =====================================
// SHIFT MANAGEMENT ROUTES
// =====================================

// POST /api/delivery-personnel/shift/clock-in - Start shift
router.post('/shift/clock-in', isAuth, isDriver, clockIn);

// POST /api/delivery-personnel/shift/clock-out - End shift
router.post('/shift/clock-out', isAuth, isDriver, clockOut);

// GET /api/delivery-personnel/shift/status - Get shift status
router.get('/shift/status', isAuth, isDriver, getShiftStatus);

// =====================================
// STATISTICS & EARNINGS ROUTES
// =====================================

// GET /api/delivery-personnel/stats - Get delivery statistics
router.get('/stats', isAuth, isDriver, getDeliveryStats);

// GET /api/delivery-personnel/earnings - Get daily earnings
router.get('/earnings', isAuth, isDriver, getDailyEarnings);

module.exports = router; 