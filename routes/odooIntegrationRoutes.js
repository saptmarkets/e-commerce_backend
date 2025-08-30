const express = require('express');
const router = express.Router();
const odooIntegrationController = require('../controller/odooIntegrationController');
const { isAuth } = require('../config/auth');

// Initialize Odoo connection
router.post('/initialize', isAuth, odooIntegrationController.initializeOdoo);

// Test Odoo connection
router.get('/test-connection', isAuth, odooIntegrationController.testConnection);

// Process orders for a specific date
router.post('/process-orders', isAuth, odooIntegrationController.processOrdersForDate);

// Retry failed orders from a session
router.post('/retry-failed-orders', isAuth, odooIntegrationController.retryFailedOrders);

// Get session report
router.get('/session/:sessionId', isAuth, odooIntegrationController.getSessionReport);

// Get all sessions
router.get('/sessions', isAuth, odooIntegrationController.getAllSessions);

// Get orders pending sync
router.get('/pending-orders', isAuth, odooIntegrationController.getPendingOrders);

// Get failed orders
router.get('/failed-orders', isAuth, odooIntegrationController.getFailedOrders);

// Get sync statistics
router.get('/statistics', isAuth, odooIntegrationController.getSyncStatistics);

// Reset order sync status (for testing)
router.put('/reset-order/:orderId', isAuth, odooIntegrationController.resetOrderSyncStatus);

// === MISSING ENDPOINTS FROM PLAN ===

// Session Management Endpoints
router.post('/order-push-sessions', isAuth, odooIntegrationController.createOrderPushSession);
router.get('/order-push-sessions/:sessionId', isAuth, odooIntegrationController.getSessionDetails);
router.post('/order-push-sessions/:sessionId/retry', isAuth, odooIntegrationController.retryFailedOrders);

// Order Management Endpoints
router.get('/orders/pending-sync', isAuth, odooIntegrationController.getPendingSyncOrders);
router.post('/orders/:orderId/sync', isAuth, odooIntegrationController.syncOrderManually);
router.get('/orders/:orderId/sync-status', isAuth, odooIntegrationController.getOrderSyncStatus);

// Statistics & Reporting Endpoints
router.get('/order-push-sessions/stats', isAuth, odooIntegrationController.getSessionStats);
router.get('/order-push-sessions/reports', isAuth, odooIntegrationController.getSessionReports);
router.get('/order-push-sessions/export', isAuth, odooIntegrationController.exportSessionReport);

// Configuration Endpoints
router.get('/odoo-sync/config', isAuth, odooIntegrationController.getOdooSyncConfig);
router.put('/odoo-sync/config', isAuth, odooIntegrationController.updateOdooSyncConfig);

module.exports = router;
