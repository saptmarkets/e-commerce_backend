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
  importAllOdooCategories, // Add the new import
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

// Refresh public pricelist items for promotions
router.post('/refresh-public-pricelist-items', async (req, res) => {
  try {
    const { incremental = false, forceRefresh = true } = req.body;
    
    // Import the odooService to fetch pricelist items
    const odooService = require('../services/odooService');
    
    console.log('🔄 Refreshing public pricelist items...');
    console.log(`   Incremental: ${incremental}, Force Refresh: ${forceRefresh}`);
    
    // Fetch pricelist items from Odoo
    const pricelistItems = await odooService.fetchPricelistItems([], 1000, 0);
    
    if (!pricelistItems || pricelistItems.length === 0) {
      console.log('⚠️ No pricelist items found in Odoo');
      return res.json({
        success: true,
        message: 'No pricelist items found to refresh',
        count: 0
      });
    }
    
    // Store in odoo_pricelist_items collection
    const OdooPricelistItem = require('../models/OdooPricelistItem');
    
    const operations = pricelistItems.map(item => ({
      updateOne: {
        filter: { id: item.id },
        update: {
          $set: {
            id: item.id,
            pricelist_id: item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[0] : item.pricelist_id) : null,
            pricelist_name: item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[1] : null) : null,
            product_tmpl_id: item.product_tmpl_id ? (Array.isArray(item.product_tmpl_id) ? item.product_tmpl_id[0] : item.product_tmpl_id) : null,
            product_id: item.product_id ? (Array.isArray(item.product_id) ? item.product_id[0] : item.product_id) : null,
            product_name: item.product_id ? (Array.isArray(item.product_id) ? item.product_id[1] : null) : null,
            applied_on: item.applied_on || '1_product',
            compute_price: item.compute_price || 'fixed',
            fixed_price: item.fixed_price,
            price_discount: item.price_discount || 0,
            min_quantity: item.min_quantity || 0,
            date_start: item.date_start ? new Date(item.date_start) : null,
            date_end: item.date_end ? new Date(item.date_end) : null,
            active: item.active !== false,
            create_date: item.create_date ? new Date(item.create_date) : new Date(),
            write_date: item.write_date ? new Date(item.write_date) : new Date(),
            _sync_status: 'pending',
            is_active: true,
          }
        },
        upsert: true
      }
    }));
    
    // Bulk write to database
    await OdooPricelistItem.bulkWrite(operations, { ordered: false });
    
    console.log(`✅ Successfully refreshed ${pricelistItems.length} pricelist items`);
    
    res.json({
      success: true,
      message: `Successfully refreshed ${pricelistItems.length} pricelist items`,
      count: pricelistItems.length,
      incremental,
      forceRefresh
    });
    
  } catch (error) {
    console.error('❌ Error refreshing public pricelist items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh pricelist items',
      error: error.message
    });
  }
});

// Data management
router.delete('/clear', clearOdooData);
router.post('/sync', syncToStore);

router.post('/import-promotions', importPromotions);
router.post('/push-back/stock', pushBackStock);

module.exports = router; 