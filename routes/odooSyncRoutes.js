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
  downloadPushBackReport,
  importAllOdooCategories,
} = require('../controller/odooSyncController');

// Connection management
router.get('/connection/test', testConnection);
router.get('/connection/status', getConnectionStatus);

// Data operations
router.post('/fetch', fetchFromOdoo);
router.post('/import', importToStore);
router.post('/import-categories', importAllOdooCategories);


router.get('/import/preview', getImportPreview);
router.get('/statistics', getSyncStatistics);
router.get('/logs', getSyncLogs);

// Data access
router.get('/products', getOdooProducts);
router.get('/categories', getOdooCategories);
router.get('/uom', getOdooUom);
router.get('/stock', getOdooStock);
router.get('/barcode-units', getOdooBarcodeUnits);
router.get('/pricelists', getOdooPricelists);
router.get('/pricelist-items', getOdooPricelistItems);
router.get('/branches', getOdooBranches);

// Data management
router.delete('/clear', clearOdooData);
router.post('/sync', syncToStore);

router.post('/import-promotions', importPromotions);
router.post('/push-back/stock', pushBackStock);
router.post('/download-report', downloadPushBackReport);

module.exports = router; 