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

const odooService = require('../services/odooService');

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

// Category-based sync routes
router.post('/sync-category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log(`🔄 Starting sync for category ID: ${categoryId}`);
    
    const result = await odooService.syncProductsByCategory(categoryId);
    
    res.json({
      success: true,
      message: `Successfully synced category: ${result.category.complete_name}`,
      data: result
    });
  } catch (error) {
    console.error(`❌ Error syncing category ${req.params.categoryId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync category',
      error: error.message
    });
  }
});

// Sync multiple categories
router.post('/sync-categories', async (req, res) => {
  try {
    const { categoryIds } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        message: 'categoryIds array is required'
      });
    }
    
    console.log(`🔄 Starting sync for ${categoryIds.length} categories:`, categoryIds);
    
    const results = [];
    const errors = [];
    
    for (const categoryId of categoryIds) {
      try {
        console.log(`📦 Syncing category ${categoryId}...`);
        const result = await odooService.syncProductsByCategory(categoryId);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error syncing category ${categoryId}:`, error.message);
        errors.push({
          categoryId: categoryId,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${results.length} categories successfully`,
      results: results,
      errors: errors,
      summary: {
        total: categoryIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('❌ Error in bulk category sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync categories',
      error: error.message
    });
  }
});

// Get products by category
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 500, offset = 0 } = req.query;
    
    console.log(`📦 Fetching products for category ${categoryId}`);
    
    const products = await odooService.fetchProductsByCategory(
      categoryId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      products: products,
      total: products.length,
      categoryId: categoryId
    });
  } catch (error) {
    console.error(`❌ Error fetching products for category ${req.params.categoryId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Get stock levels by category
router.get('/stock/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 500, offset = 0 } = req.query;
    
    console.log(`📊 Fetching stock levels for category ${categoryId}`);
    
    const stockLevels = await odooService.fetchStockByCategory(
      categoryId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      stockLevels: stockLevels,
      total: stockLevels.length,
      categoryId: categoryId
    });
  } catch (error) {
    console.error(`❌ Error fetching stock for category ${req.params.categoryId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock levels',
      error: error.message
    });
  }
});

module.exports = router; 