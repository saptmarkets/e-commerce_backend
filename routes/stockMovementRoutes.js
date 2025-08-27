const express = require('express');
const router = express.Router();
const {
  getStockMovements,
  getStockMovementById,
  createStockMovement,
  updateStockMovement,
  deleteStockMovement,
  getProductMovements,
  getMovementStatistics,
  syncMovementToOdoo,
  bulkSyncMovements,
  getSyncBatches,
  exportMovements,
  testCreateStockMovement
} = require('../controller/stockMovementController');
const { isAuth, isAdmin } = require('../config/auth');

// Test endpoint
router.post('/test-create', isAuth, isAdmin, testCreateStockMovement);

// CRUD operations
router.get('/', isAuth, isAdmin, getStockMovements);
router.get('/statistics', isAuth, isAdmin, getMovementStatistics);
router.get('/:id', isAuth, isAdmin, getStockMovementById);
router.post('/', isAuth, isAdmin, createStockMovement);
router.put('/:id', isAuth, isAdmin, updateStockMovement);
router.delete('/:id', isAuth, isAdmin, deleteStockMovement);

// Product-specific movements
router.get('/product/:productId', isAuth, isAdmin, getProductMovements);

// Odoo sync operations
router.post('/:id/sync', isAuth, isAdmin, syncMovementToOdoo);
router.post('/bulk-sync', isAuth, isAdmin, bulkSyncMovements);
router.get('/sync/batches', isAuth, isAdmin, getSyncBatches);

// Export
router.get('/export/csv', isAuth, isAdmin, exportMovements);

module.exports = router; 