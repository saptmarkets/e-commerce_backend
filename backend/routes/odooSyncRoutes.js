const express = require('express');
const router = express.Router();
const {
  testConnection,
  getConnectionStatus,
  fetchFromOdoo,
  importToStore,
  getImportPreview,
  getSyncStatistics,
  getSyncLogs,
  getOdooProducts,
  getOdooCategories,
  getOdooUom,
  getOdooStock,
  getOdooBarcodeUnits,
  getOdooPricelists,
  getOdooPricelistItems,
  clearOdooData,
  syncToStore,
  importPromotions,
  getOdooBranches,
  pushBackStock,
} = require('../controller/odooSyncController');

// Connection management
router.get('/connection/test', testConnection);
router.get('/connection/status', getConnectionStatus);

// Data synchronization
router.post('/fetch', fetchFromOdoo);
router.post('/import', importToStore);
router.post('/import/preview', getImportPreview);
router.get('/statistics', getSyncStatistics);
router.get('/logs', getSyncLogs);
router.post('/sync', syncToStore);

// Odoo data viewing
router.get('/products', getOdooProducts);
router.get('/categories', getOdooCategories);
router.get('/uom', getOdooUom);
router.get('/stock', getOdooStock);
router.get('/barcode-units', getOdooBarcodeUnits);
router.get('/pricelists', getOdooPricelists);
router.get('/pricelist-items', getOdooPricelistItems);

// Data management
router.delete('/clear', clearOdooData);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Odoo sync routes working' });
});

router.post('/import-promotions', importPromotions);

router.get('/branches', getOdooBranches);
router.post('/push-back/stock', pushBackStock);

module.exports = router; 