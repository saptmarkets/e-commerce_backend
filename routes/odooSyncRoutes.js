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

const OdooService = require('../services/odooService');
const odooService = new OdooService();

// Connection management
router.get('/connection/test', testConnection);
router.get('/connection/status', getConnectionStatus);
router.get('/connection/status/realtime', async (req, res) => {
  try {
    const realtimeStatus = await odooService.getRealTimeConnectionStatus();
    res.status(200).json({
      success: true,
      data: realtimeStatus
    });
  } catch (error) {
    console.error('Error getting real-time connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time connection status',
      error: error.message
    });
  }
});

// 🔥 NEW: Auto-refresh connection status endpoint
router.get('/connection/auto-refresh', async (req, res) => {
  try {
    const realtimeStatus = await odooService.getRealTimeConnectionStatus();
    
    // Return minimal data for auto-refresh (frontend can poll this)
    res.status(200).json({
      success: true,
      data: {
        connected: realtimeStatus.connected,
        status: realtimeStatus.status,
        message: realtimeStatus.message,
        lastChecked: realtimeStatus.lastChecked,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      data: {
        connected: false,
        status: 'Error',
        message: 'Connection check failed',
        lastChecked: new Date(),
        timestamp: Date.now()
      }
    });
  }
});

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

// 🔥 NEW: Promotion import status and auto-update
router.post('/promotions/check-imported', async (req, res) => {
  try {
    const { autoUpdatePromotions = true } = req.body || {};
    console.log('🔍 Checking promotion import status...');
    
    const OdooPricelistItem = require('../models/OdooPricelistItem');
    const Promotion = require('../models/Promotion');
    
    // Get all pricelist items
    const allPricelistItems = await OdooPricelistItem.find({ is_active: true }).lean();
    
    if (allPricelistItems.length === 0) {
      return res.json({
        success: true,
        message: 'No pricelist items found',
        data: {
          total: 0,
          imported: 0,
          pending: 0,
          failed: 0,
          skipped: 0
        }
      });
    }
    
    // Check import status for each item
    const statusCounts = {
      total: allPricelistItems.length,
      imported: 0,
      pending: 0,
      failed: 0,
      skipped: 0
    };
    
    const itemsWithStatus = [];
    
    for (const item of allPricelistItems) {
      try {
        // Check if this item has a corresponding store promotion
        const storePromotion = await Promotion.findOne({
          odoo_pricelist_item_id: item.id
        });
        
        if (storePromotion) {
          statusCounts.imported++;
          itemsWithStatus.push({
            ...item,
            _sync_status: 'imported',
            store_promotion_id: storePromotion._id
          });
        } else {
          statusCounts.pending++;
          itemsWithStatus.push({
            ...item,
            _sync_status: 'pending'
          });
        }
      } catch (error) {
        console.error(`Error checking item ${item.id}:`, error);
        statusCounts.failed++;
        itemsWithStatus.push({
          ...item,
          _sync_status: 'failed',
          error: error.message
        });
      }
    }
    
    // Auto-update promotions if requested
    let updateResult = null;
    if (autoUpdatePromotions) {
      try {
        // 🔥 FIXED: Only sync already imported promotions, not create new ones
        const importedItems = allPricelistItems.filter(item => 
          itemsWithStatus.find(statusItem => 
            statusItem.id === item.id && statusItem._sync_status === 'imported'
          )
        );
        
        if (importedItems.length > 0) {
          console.log(`🔄 Auto-updating ${importedItems.length} already imported promotions...`);
          const importService = require('../services/odooImportService');
          
          // Only process items that are already imported
          const targetIds = importedItems.map(i => i.id);
          
          if (targetIds.length > 0) {
            // 🔥 Use the dedicated update function instead of import
            updateResult = await importService.updateExistingPromotions(targetIds);
            console.log('✅ Auto-sync completed for', targetIds.length, 'imported items');
          }
        } else {
          console.log('ℹ️ No imported promotions to update');
          updateResult = { message: 'No imported promotions to update' };
        }
      } catch (error) {
        console.error('❌ Auto-update failed:', error);
        updateResult = { error: error.message };
      }
    }
    
    res.json({
      success: true,
      message: `Promotion import status checked successfully`,
      data: {
        ...statusCounts,
        items: itemsWithStatus,
        updateResult
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking promotion import status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check promotion import status',
      error: error.message
    });
  }
});

// 🔥 NEW: Force refresh pricelist items route
router.post('/force-refresh-pricelist-items', async (req, res) => {
  try {
    console.log('🔄 Force refresh pricelist items requested...');
    
    // Import odooSyncService to fetch and update local collection
    const OdooSyncService = require('../services/odooSyncService');
    const syncService = new OdooSyncService();
    
    const result = await syncService.fetchPricelistItems(false, true); // forceRefresh = true
    
    res.json({
      success: true,
      message: `Force refreshed ${result} pricelist items`,
      data: { totalRefreshed: result }
    });
  } catch (error) {
    console.error('❌ Error force refreshing pricelist items:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to force refresh pricelist items',
      error: error.message
    });
  }
});

// 🔥 NEW: Lightweight route for refreshing ONLY public pricelist items
router.post('/refresh-public-pricelist-items', async (req, res) => {
  try {
    console.log('🎯 Lightweight refresh of public pricelist items requested...');
    
    const OdooService = require('../services/odooService');
    const odooService = new OdooService();
    const OdooPricelistItem = require('../models/OdooPricelistItem');
    
    // Step 1: Get public pricelist IDs (from local collection for speed)
    const publicPricelists = await require('../models/OdooPricelist').find({ 
      name: /public/i,
      active: true 
    }).select('id').lean();
    
    if (publicPricelists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No public pricelists found in local collection'
      });
    }
    
    const publicIds = publicPricelists.map(pl => pl.id);
    console.log(`🎯 Found ${publicIds.length} public pricelists, fetching their items...`);
    
    // Step 2: Fetch ALL public pricelist items from Odoo (no incremental, no date filters)
    const domain = [
      ['pricelist_id', 'in', publicIds]
      // Removed 'active' filter as it doesn't exist in product.pricelist.item model
    ];
    
    console.log(`🔍 Fetching with domain:`, JSON.stringify(domain, null, 2));
    
    let allItems = [];
    let offset = 0;
    const batchSize = 500;
    
    // Fetch all items in batches
    while (true) {
      const batch = await odooService.fetchPricelistItems(domain, batchSize, offset);
      if (!batch || batch.length === 0) break;
      
      allItems.push(...batch);
      offset += batchSize;
      
      if (batch.length < batchSize) break;
    }
    
    console.log(`📦 Fetched ${allItems.length} total pricelist items from Odoo`);
    
    if (allItems.length === 0) {
      return res.json({
        success: true,
        message: 'No pricelist items found in public pricelists',
        data: { totalFetched: 0, totalReplaced: 0 }
      });
    }
    
    // Step 3: Clear existing collection and insert new items (complete replacement)
    console.log(`🗑️ Clearing existing ${publicIds.length} public pricelist items...`);
    await OdooPricelistItem.deleteMany({ 
      pricelist_id: { $in: publicIds } 
    });
    
    // Step 4: Prepare new items with proper mapping
    const newItems = allItems.map(item => ({
      id: item.id,
      pricelist_id: item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[0] : item.pricelist_id) : null,
      pricelist_name: item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[1] : null) : null,
      product_tmpl_id: item.product_tmpl_id ? (Array.isArray(item.product_tmpl_id) ? item.product_tmpl_id[0] : item.product_tmpl_id) : null,
      product_id: item.product_id ? (Array.isArray(item.product_id) ? item.product_id[0] : item.product_id) : null,
      product_name: item.product_id ? (Array.isArray(item.product_id) ? item.product_id[1] : null) : null,
      barcode_unit_id: item.barcode_unit_id ? (Array.isArray(item.barcode_unit_id) ? item.barcode_unit_id[0] : item.barcode_unit_id) : null,
      barcode_unit_name: item.barcode_unit_id ? (Array.isArray(item.barcode_unit_id) ? item.barcode_unit_id[1] : null) : null,
      applied_on: item.applied_on || '1_product',
      compute_price: item.compute_price || 'fixed',
      fixed_price: item.fixed_price,
      price_discount: item.price_discount || 0,
      price_surcharge: item.price_surcharge || 0,
      price_round: item.price_round || 0,
      price_min_margin: item.price_min_margin || 0,
      price_max_margin: item.price_max_margin || 0,
      percent_price: item.percent_price || 0,
      min_quantity: item.min_quantity || 0,
      max_quantity: item.max_quantity,
      date_start: item.date_start ? new Date(item.date_start) : null,
      date_end: item.date_end ? new Date(item.date_end) : null,
      base_pricelist_id: item.base_pricelist_id ? (Array.isArray(item.base_pricelist_id) ? item.base_pricelist_id[0] : item.base_pricelist_id) : null,
      base: item.base || 'list_price',
      company_id: item.company_id ? (Array.isArray(item.company_id) ? item.company_id[0] : item.company_id) : null,
      currency_id: item.currency_id ? (Array.isArray(item.currency_id) ? item.currency_id[0] : item.currency_id) : null,
      // Removed active field as it doesn't exist in Odoo product.pricelist.item model
      create_date: item.create_date ? new Date(item.create_date) : new Date(),
      write_date: item.write_date ? new Date(item.write_date) : new Date(),
      _sync_status: 'pending',
      is_active: true,
      last_sync_date: new Date()
    }));
    
    // Step 5: Insert all new items
    console.log(`💾 Inserting ${newItems.length} new pricelist items...`);
    await OdooPricelistItem.insertMany(newItems);

    // Step 6: Backfill links to existing promotions using Odoo IDs
    try {
      console.log('🔗 Backfilling store_promotion_id links using Promotion.odoo_pricelist_item_id...');
      const Promotion = require('../models/Promotion');
      const linkedPromos = await Promotion.find({ odoo_pricelist_item_id: { $ne: null } }, '_id odoo_pricelist_item_id').lean();
      if (linkedPromos && linkedPromos.length) {
        const bulkOps = linkedPromos.map(p => ({
          updateOne: {
            filter: { id: p.odoo_pricelist_item_id },
            update: { $set: { store_promotion_id: p._id, _sync_status: 'imported' } }
          }
        }));
        if (bulkOps.length) {
          const resBF = await OdooPricelistItem.bulkWrite(bulkOps, { ordered: false });
          console.log('✅ Backfill result:', JSON.stringify(resBF));
        }
      }
    } catch (bfErr) {
      console.warn('⚠️ Backfill linking failed (non-fatal):', bfErr.message);
    }
    
    console.log(`✅ Successfully refreshed public pricelist items`);
    
    res.json({
      success: true,
      message: `Successfully refreshed ${newItems.length} public pricelist items`,
      data: { 
        totalFetched: allItems.length, 
        totalReplaced: newItems.length,
        publicPricelistIds: publicIds
      }
    });
    
  } catch (error) {
    console.error('❌ Error refreshing public pricelist items:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh public pricelist items',
      error: error.message
    });
  }
});



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

// Get sync progress for a category
router.get('/sync-category/:categoryId/progress', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Get the current sync progress from odooService
    const progress = await odooService.getCategorySyncProgress(categoryId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error(`❌ Error getting progress for category ${req.params.categoryId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync progress',
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