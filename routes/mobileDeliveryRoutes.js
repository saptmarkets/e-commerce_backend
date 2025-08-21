const express = require('express');
const router = express.Router();
const {
  mobileLogin,
  getMobileProfile,
  getMobileOrders,
  getMobileOrderDetails,
  mobileToggleProduct,
  mobileMarkOutForDelivery,
  mobileCompleteDelivery,
  generateBill,
  printBill,
  getTodayEarnings,
  getCompletedOrders,
  mobileClockIn,
  mobileClockOut,
  mobileBreakIn,
  mobileBreakOut,
  mobileAcceptOrder,
  debugOrderChecklist,
  forceRegenerateChecklist,
  mobileSaveProductChecklist
} = require('../controller/mobileDeliveryController');

// Mobile authentication middleware
const mobileAuth = async (req, res, next) => {
  try {
    // Try both Authorization and authorization headers
    let token = req.header('Authorization') || req.header('authorization');
    
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    console.log('🔐 Mobile auth - Token received:', token ? 'Yes' : 'No');
    console.log('🔐 Authorization header:', req.header('Authorization') ? 'Found' : 'Not found');
    console.log('🔐 authorization header:', req.header('authorization') ? 'Found' : 'Not found');
    
    if (!token) {
      console.log('❌ No token provided in mobile auth');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('✅ Mobile token decoded successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Mobile auth error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

// =====================================
// MOBILE DELIVERY APP ROUTES
// =====================================

// Authentication
router.post('/login', mobileLogin);

// Profile (protected route)
router.get('/profile', mobileAuth, getMobileProfile);

// Orders (protected routes)
router.get('/orders', mobileAuth, getMobileOrders);

// Statistics - Must come before :orderId routes to avoid conflicts
router.get('/orders/completed', mobileAuth, getCompletedOrders);
router.get('/earnings/today', mobileAuth, getTodayEarnings);

// Order details (must come after specific routes like /completed)
router.get('/orders/:orderId', mobileAuth, getMobileOrderDetails);

// Order assignment
router.post('/orders/:orderId/accept', mobileAuth, mobileAcceptOrder);

// Product collection
router.post('/orders/:orderId/toggle-product', mobileAuth, mobileToggleProduct);

// Save entire product checklist
router.post('/orders/:orderId/save-checklist', mobileAuth, mobileSaveProductChecklist);

// Order status updates
router.post('/orders/:orderId/out-for-delivery', mobileAuth, mobileMarkOutForDelivery);
router.post('/orders/:orderId/complete', mobileAuth, mobileCompleteDelivery);

// Bill printing
router.get('/orders/:orderId/bill', mobileAuth, generateBill);
router.post('/orders/:orderId/print-bill', mobileAuth, printBill);

// Clock management
router.post('/clock-in', mobileAuth, mobileClockIn);
router.post('/clock-out', mobileAuth, mobileClockOut);

// Break management
router.post('/break-in', mobileAuth, mobileBreakIn);
router.post('/break-out', mobileAuth, mobileBreakOut);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile delivery API is running',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for product checklist (development only)
router.get('/debug/order/:orderId/checklist', mobileAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.userId;
    
    const Order = require('../models/Order');
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not assigned to you'
      });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        hasDeliveryInfo: !!order.deliveryInfo,
        hasProductChecklist: !!(order.deliveryInfo?.productChecklist),
        checklistCount: order.deliveryInfo?.productChecklist?.length || 0,
        cartItemsCount: order.cart?.length || 0,
        checklist: order.deliveryInfo?.productChecklist || [],
        cartItems: order.cart || [],
        // Add collection status information
        collectionStatus: order.deliveryInfo?.productChecklist?.map(item => ({
          productId: item.productId,
          title: item.title,
          collected: item.collected,
          collectedAt: item.collectedAt,
          collectedBy: item.collectedBy,
          notes: item.notes
        })) || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Debug endpoint to check checklist preservation
router.get('/debug/order/:orderId/checklist-preservation', mobileAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.userId;
    
    const Order = require('../models/Order');
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not assigned to you'
      });
    }
    
    // Check if checklist has collection status preserved
    const checklistWithStatus = order.deliveryInfo?.productChecklist || [];
    const hasCollectionStatus = checklistWithStatus.some(item => 
      item.hasOwnProperty('collected') || 
      item.hasOwnProperty('collectedAt') || 
      item.hasOwnProperty('collectedBy')
    );
    
    res.json({
      success: true,
      data: {
        orderId: order._id,
        hasChecklist: !!order.deliveryInfo?.productChecklist,
        checklistLength: checklistWithStatus.length,
        hasCollectionStatus,
        collectionStatusPreserved: hasCollectionStatus,
        sampleItems: checklistWithStatus.slice(0, 3).map(item => ({
          productId: item.productId,
          title: item.title,
          collected: item.collected,
          collectedAt: item.collectedAt,
          collectedBy: item.collectedBy,
          hasTitle: !!item.title,
          hasUnitName: !!item.unitName,
          hasPrice: item.price !== undefined
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Debug endpoint
router.get('/debug/order/:orderId/checklist', mobileAuth, debugOrderChecklist);

// Force regenerate checklist (debug)
router.post('/debug/order/:orderId/regenerate-checklist', mobileAuth, forceRegenerateChecklist);

// Debug endpoint to check request data for toggle product
router.post('/debug/toggle-product', mobileAuth, async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    res.json({
      success: true,
      message: 'Debug endpoint for toggle product',
      data: {
        driverId,
        requestBody: req.body,
        requestQuery: req.query,
        requestParams: req.params,
        requestHeaders: {
          'content-type': req.headers['content-type'],
          'authorization': req.headers.authorization ? 'Present' : 'Missing',
          'user-agent': req.headers['user-agent']
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

module.exports = router; 