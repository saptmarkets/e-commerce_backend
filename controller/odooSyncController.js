const odooSyncService = require('../services/odooSyncService');
const odooService = require('../services/odooService');
const odooImportService = require('../services/odooImportService');
const OdooSyncLog = require('../models/OdooSyncLog');
const OdooProduct = require('../models/OdooProduct');
const OdooCategory = require('../models/OdooCategory');
const OdooUom = require('../models/OdooUom');
const OdooStock = require('../models/OdooStock');
const OdooBarcodeUnit = require('../models/OdooBarcodeUnit');
const OdooPricelist = require('../models/OdooPricelist');
const OdooPricelistItem = require('../models/OdooPricelistItem');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const StockPushSession = require('../models/StockPushSession');
const StockMovementLog = require('../models/StockMovementLog');
const Admin = require('../models/Admin');

/**
 * Test Odoo connection
 */
const testConnection = async (req, res) => {
  try {
    const result = await odooSyncService.testConnection();
    
    res.status(200).json({
      success: true,
      message: result.success ? 'Connection successful' : 'Connection failed',
      data: result,
    });
  } catch (error) {
    console.error('Error testing Odoo connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connection',
      error: error.message,
    });
  }
};

/**
 * Get connection status
 */
const getConnectionStatus = async (req, res) => {
  try {
    const status = odooSyncService.getConnectionStatus();
    
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection status',
      error: error.message,
    });
  }
};

/**
 * Fetch data from Odoo
 */
const fetchFromOdoo = async (req, res) => {
  try {
    const { dataTypes = ['all'], config = {} } = req.body;
    const user = req.admin; // Assuming admin authentication middleware
    
    // Support batching parameters from request body
    if (req.body.offset !== undefined) {
      config.offset = parseInt(req.body.offset);
    }
    if (req.body.limit !== undefined) {
      config.limit = parseInt(req.body.limit);
    }
    
    console.log('🚀 fetchFromOdoo called with config:', config);
    
    // Start the sync process
    const results = await odooSyncService.fetchFromOdoo(dataTypes, config, user);
    
    res.status(200).json({
      success: true,
      message: `Data fetch from Odoo completed successfully${config.offset !== undefined || config.limit !== undefined ? ' (batched)' : ''}`,
      data: results,
      batching: config.offset !== undefined || config.limit !== undefined ? {
        offset: config.offset || 0,
        limit: config.limit || 'all',
        processed: results.products || 0
      } : null
    });
  } catch (error) {
    console.error('Error fetching from Odoo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data from Odoo',
      error: error.message,
    });
  }
};

/**
 * Get sync statistics
 */
const getSyncStatistics = async (req, res) => {
  try {
    const stats = await odooSyncService.getSyncStatistics();
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting sync statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync statistics',
      error: error.message,
    });
  }
};

/**
 * Get sync logs
 */
const getSyncLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      operation_type,
      data_type,
      status,
      start_date,
      end_date,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = {};
    if (operation_type) filter.operation_type = operation_type;
    if (data_type) filter.data_type = data_type;
    if (status) filter.status = status;
    if (start_date || end_date) {
      filter.started_at = {};
      if (start_date) filter.started_at.$gte = new Date(start_date);
      if (end_date) filter.started_at.$lte = new Date(end_date);
    }

    const [logs, total] = await Promise.all([
      OdooSyncLog.find(filter)
        .sort({ started_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('triggered_by.user_id', 'name email'),
      OdooSyncLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting sync logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync logs',
      error: error.message,
    });
  }
};

/**
 * Get Odoo products with pagination and search
 */
const getOdooProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category_id,
      sync_status,
      sort = 'write_date',
      order = 'desc',
      include = 'basic', // "basic" | "details"
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = { is_active: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { default_code: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }
    if (category_id) filter.categ_id = parseInt(category_id);  // Changed from category_id to categ_id
    if (sync_status) filter._sync_status = sync_status;

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    let products = [];
    let total = 0;

    if (include === 'details') {
      // Aggregated pipeline with lookups
      const pipeline = [
        { $match: filter },
        { $sort: sortObj },
        { $skip: skip },
        { $limit: parseInt(limit) },
        // Category - Fix: use 'categ_id' not 'category_id'
        { $lookup: {
            from: 'odoo_categories',
            localField: 'categ_id',
            foreignField: 'id',
            as: 'category'
        }},
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        // UoM
        { $lookup: {
            from: 'odoo_uoms',
            localField: 'uom_id',
            foreignField: 'id',
            as: 'uom'
        }},
        { $unwind: { path: '$uom', preserveNullAndEmptyArrays: true } },
        // Barcode units - Fix: ensure 'product_id' field is used correctly
        { $lookup: {
            from: 'odoo_barcode_units',
            localField: 'id',  // Changed from 'product_id' to 'id' as that's the Odoo product ID
            foreignField: 'product_id',
            as: 'barcode_units'
        }},
        // Stock - Fix: ensure 'product_id' field is used correctly
        { $lookup: {
            from: 'odoo_stock',
            localField: 'id',  // Changed from 'product_id' to 'id' as that's the Odoo product ID
            foreignField: 'product_id',
            as: 'stock_records'
        }},
        // Pricelist items
        { $lookup: {
            from: 'odoo_pricelist_items',
            localField: 'product_tmpl_id',
            foreignField: 'product_tmpl_id',
            as: 'pricelist_items'
        }},
        // Add total_stock
        { $addFields: {
            total_stock: { $sum: '$stock_records.quantity' }
        }}
      ];

      const aggregateCursor = await OdooProduct.aggregate(pipeline);
      products = aggregateCursor;
      total = await OdooProduct.countDocuments(filter);
    } else {
      // Basic list without heavy lookups
      [products, total] = await Promise.all([
        OdooProduct.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        OdooProduct.countDocuments(filter),
      ]);
    }

    // Log the product IDs being sent to the frontend
    console.log("Product IDs being sent to frontend:", products.map(p => p.id));

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting Odoo products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Odoo products',
      error: error.message,
    });
  }
};

/**
 * Get Odoo categories
 */
const getOdooCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      parent_id,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = { is_active: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { complete_name: { $regex: search, $options: 'i' } },
      ];
    }
    if (parent_id) {
      filter.parent_id = parent_id === 'null' ? null : parseInt(parent_id);
    }

    const [categories, total] = await Promise.all([
      OdooCategory.find(filter)
        .sort({ complete_name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OdooCategory.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting Odoo categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Odoo categories',
      error: error.message,
    });
  }
};

/**
 * Get Odoo UoMs
 */
const getOdooUom = async (req, res) => {
  try {
    const uoms = await OdooUom.find({ is_active: true })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { uoms },
    });
  } catch (error) {
    console.error('Error getting Odoo UoMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Odoo UoMs',
      error: error.message,
    });
  }
};

/**
 * Get Odoo stock
 */
const getOdooStock = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      product_id,
      location_id,
      min_quantity,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = { is_active: true };
    if (product_id) filter.product_id = parseInt(product_id);
    if (location_id) filter.location_id = parseInt(location_id);
    if (min_quantity) filter.quantity = { $gte: parseFloat(min_quantity) };

    const [stock, total] = await Promise.all([
      OdooStock.find(filter)
        .sort({ write_date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OdooStock.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stock,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting Odoo stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Odoo stock',
      error: error.message,
    });
  }
};

/**
 * Get Odoo barcode units
 */
const getOdooBarcodeUnits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      product_id,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = { is_active: true };
    if (product_id) filter.product_id = parseInt(product_id);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { product_name: { $regex: search, $options: 'i' } },
      ];
    }

    const [units, total] = await Promise.all([
      OdooBarcodeUnit.find(filter)
        .sort({ sequence: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OdooBarcodeUnit.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        units,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting Odoo barcode units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Odoo barcode units',
      error: error.message,
    });
  }
};

/**
 * Get Odoo pricelists
 */
const getOdooPricelists = async (req, res) => {
  try {
    const pricelists = await OdooPricelist.find({ is_active: true })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { pricelists },
    });
  } catch (error) {
    console.error('Error getting Odoo pricelists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Odoo pricelists',
      error: error.message,
    });
  }
};

/**
 * Get Odoo pricelist items
 */
const getOdooPricelistItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      pricelist_id,
      product_id,
      active_only = 'true',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = { is_active: true };
    if (pricelist_id) filter.pricelist_id = parseInt(pricelist_id);
    if (product_id) filter.product_id = parseInt(product_id);

    // Only fixed price lines by default
    filter.compute_price = 'fixed';

    // Active validity window check (only current/future promos when active_only truthy)
    if (active_only !== 'false') {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      filter.$or = [
        { date_end: null },
        { date_end: { $gte: endOfToday } },
      ];
    }

    const [items, total] = await Promise.all([
      OdooPricelistItem.find(filter)
        .sort({ write_date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OdooPricelistItem.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting Odoo pricelist items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Odoo pricelist items',
      error: error.message,
    });
  }
};

/**
 * Clear Odoo data
 */
const clearOdooData = async (req, res) => {
  try {
    const { dataTypes = ['all'] } = req.body;
    
    const results = {};
    
    if (dataTypes.includes('all') || dataTypes.includes('products')) {
      results.products = await OdooProduct.deleteMany({});
    }
    
    if (dataTypes.includes('all') || dataTypes.includes('categories')) {
      results.categories = await OdooCategory.deleteMany({});
    }
    
    if (dataTypes.includes('all') || dataTypes.includes('uom')) {
      results.uom = await OdooUom.deleteMany({});
    }
    
    if (dataTypes.includes('all') || dataTypes.includes('stock')) {
      results.stock = await OdooStock.deleteMany({});
    }
    
    if (dataTypes.includes('all') || dataTypes.includes('barcode_units')) {
      results.barcode_units = await OdooBarcodeUnit.deleteMany({});
    }
    
    if (dataTypes.includes('all') || dataTypes.includes('pricelists')) {
      results.pricelists = await OdooPricelist.deleteMany({});
    }
    
    if (dataTypes.includes('all') || dataTypes.includes('pricelist_items')) {
      results.pricelist_items = await OdooPricelistItem.deleteMany({});
    }

    res.status(200).json({
      success: true,
      message: 'Odoo data cleared successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error clearing Odoo data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear Odoo data',
      error: error.message,
    });
  }
};

/**
 * Import selected data to store
 */
const importToStore = async (req, res) => {
  try {
    console.log('🔍 Import request received:', {
      body: req.body,
      importConfig: req.body.importConfig,
      productIds: req.body.importConfig?.productIds,
      categoryIds: req.body.importConfig?.categoryIds
    });

    const { importConfig } = req.body;
    const user = req.admin;
    
    if (!importConfig) {
      console.log('❌ No importConfig provided');
      return res.status(400).json({
        success: false,
        message: 'Import configuration is required',
      });
    }
    
    console.log('🚀 Starting import with config:', importConfig);
    const results = await odooImportService.importToStore(importConfig, user);
    
    console.log('✅ Import completed with results:', results);
    
    // Format response for frontend
    const responseData = {
      products: results.products || 0,
      categories: results.categories || 0,
      units: results.units || 0,
      errors: results.errors || []
    };
    
    res.status(200).json({
      success: true,
      message: `Import completed successfully! Products: ${responseData.products}, Categories: ${responseData.categories}, Units: ${responseData.units}`,
      data: responseData,
    });
  } catch (error) {
    console.error('❌ Error importing to store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import data to store',
      error: error.message,
    });
  }
};

/**
 * Get import preview
 */
const getImportPreview = async (req, res) => {
  try {
    const { importConfig } = req.body;
    
    if (!importConfig) {
      return res.status(400).json({
        success: false,
        message: 'Import configuration is required',
      });
    }
    
    const preview = await odooImportService.getImportPreview(importConfig);
    
    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error) {
    console.error('Error getting import preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get import preview',
      error: error.message,
    });
  }
};

/**
 * Sync selected fields from odoo_* collections to store collections
 */
const syncToStore = async (req, res) => {
  try {
    console.log('🚨🚨🚨 SYNC TO STORE FUNCTION CALLED! 🚨🚨🚨');
    console.log('🔍 syncToStore called with:', { fields: req.body?.fields, productIds: req.body?.productIds });
    
    const { fields = {}, productIds = [] } = req.body || {};

    // Determine which fields
    const allowed = {
      name: !!fields.name,
      price: !!fields.price,
      stock: !!fields.stock,
      categories: !!fields.categories,
      units: !!fields.units,
      promotions: !!fields.promotions,
    };

    console.log('📋 Allowed fields for sync:', allowed);

    // 🚀 FOLLOWING CATEGORY SYNC PATTERN: Get all Odoo products from temp tables
    console.log('🚀 Following category sync pattern: Fetching from temp Odoo tables...');
    
    let odooProducts = [];
    
    if (productIds && productIds.length > 0) {
      // If specific product IDs provided, find those Odoo products
      odooProducts = await OdooProduct.find({ 
        id: { $in: productIds } 
      }).lean();
      console.log(`📦 Found ${odooProducts.length} specific Odoo products to sync`);
    } else {
      // If no specific IDs, get all Odoo products (with limit)
      const MAX_SYNC_PRODUCTS = 1000; // Safety limit
      odooProducts = await OdooProduct.find({}).limit(MAX_SYNC_PRODUCTS).lean();
      
      if (odooProducts.length === MAX_SYNC_PRODUCTS) {
        console.log(`⚠️ Reached safety limit of ${MAX_SYNC_PRODUCTS} products. Consider syncing specific categories or products.`);
      }
      
      console.log(`📦 Found ${odooProducts.length} Odoo products to sync from temp tables`);
    }
    
    if (odooProducts.length === 0) {
      return res.json({ 
        success: true, 
        updated: 0, 
        unitsUpdated: 0,
        priceUnitsUpdated: 0,
        promosUpdated: 0, 
        errors: [],
        message: 'No Odoo products found in temp tables to sync.'
      });
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Pre-fetch ALL data in bulk to avoid individual queries
    console.log('🚀 Pre-fetching all required data in bulk...');
    
    // 1. Pre-fetch all store products that match these Odoo products
    const odooProductIds = odooProducts.map(op => op.id);
    console.log(`🔍 Looking for store products with odoo_id in:`, odooProductIds.slice(0, 5), `... (${odooProductIds.length} total)`);
    
    const allStoreProducts = await Product.find({ 
      odoo_id: { $in: odooProductIds } 
    }).lean();
    
    // Create a map for fast lookup: odoo_id -> storeProduct
    const storeProductMap = new Map(
      allStoreProducts.map(sp => [sp.odoo_id, sp])
    );
    
    console.log(`📦 Pre-fetched ${allStoreProducts.length} store products`);
    console.log(`🔍 Sample store products found:`, allStoreProducts.slice(0, 3).map(sp => ({
      _id: sp._id,
      odoo_id: sp.odoo_id,
      title: sp.title,
      price: sp.price,
      stock: sp.stock
    })));
    
    // Debug: Check if we're finding the right products
    if (allStoreProducts.length === 0) {
      console.log(`⚠️ WARNING: No store products found! This means sync will update 0 products.`);
      console.log(`🔍 Check if store products have correct odoo_id values that match Odoo product IDs.`);
    } else {
      console.log(`✅ Found ${allStoreProducts.length} store products to potentially update`);
      
      // Debug: Show sample store products and their odoo_id values
      console.log(`🔍 Sample store products with odoo_id:`, allStoreProducts.slice(0, 5).map(sp => ({
        _id: sp._id,
        odoo_id: sp.odoo_id,
        title: sp.title,
        price: sp.price,
        stock: sp.stock
      })));
      
      // Debug: Show sample Odoo products and their ID values
      console.log(`🔍 Sample Odoo products with ID:`, odooProducts.slice(0, 5).map(op => ({
        id: op.id,
        name: op.name,
        list_price: op.list_price,
        qty_available: op.qty_available
      })));
      
      // Debug: Check for matching IDs
      const storeOdooIds = allStoreProducts.map(sp => sp.odoo_id).filter(Boolean);
      const odooIds = odooProducts.map(op => op.id);
      
      console.log(`🔍 Store products with odoo_id: ${storeOdooIds.length}`);
      console.log(`🔍 Odoo products available: ${odooIds.length}`);
      
      // Find matches
      const matches = storeOdooIds.filter(id => odooIds.includes(id));
      console.log(`🔍 Matching IDs found: ${matches.length}`);
      
      if (matches.length === 0) {
        console.log(`⚠️ NO MATCHES FOUND! This explains why 0 products are updated.`);
        console.log(`🔍 Sample store odoo_ids:`, storeOdooIds.slice(0, 10));
        console.log(`🔍 Sample Odoo IDs:`, odooIds.slice(0, 10));
      } else {
        console.log(`✅ Found ${matches.length} matching products that can be updated`);
      }
    }
    
    // 2. Pre-fetch all stock data if stock sync is needed (like category sync does)
    let stockMap = new Map();
    if (allowed.stock) {
      const allStockRecords = await OdooStock.find({ 
        product_id: { $in: odooProductIds },
        is_active: true 
      }).lean();
      
      // Group stock records by product_id (same pattern as category sync)
      stockMap = new Map();
      allStockRecords.forEach(record => {
        if (!stockMap.has(record.product_id)) {
          stockMap.set(record.product_id, []);
        }
        stockMap.get(record.product_id).push(record);
      });
      
      console.log(`📊 Pre-fetched stock data for ${stockMap.size} products`);
    }
    
    // 3. Pre-fetch categories if needed
    let categoryMap = new Map();
    if (allowed.categories) {
      const categoryIds = [...new Set(odooProducts.map(op => op.categ_id).filter(Boolean))];
      if (categoryIds.length > 0) {
        const categories = await OdooCategory.find({ 
          id: { $in: categoryIds } 
        }).lean();
        categoryMap = new Map(categories.map(cat => [cat.id, cat.store_category_id]));
        console.log(`📂 Pre-fetched ${categories.length} categories for mapping`);
      }
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Batch updates
    const bulkOps = [];
    const unitsToSync = [];
    let updated = 0;
    let unitsUpdated = 0;  // Initialize to prevent undefined error
    let priceUnitsUpdated = 0;  // Initialize to prevent undefined error
    const errors = [];

    console.log(`🔄 Starting sync process for ${odooProducts.length} Odoo products...`);
    
    for (let i = 0; i < odooProducts.length; i++) {
      const odooProduct = odooProducts[i];
      
      // Show progress every 50 products
      if (i % 50 === 0 || i === odooProducts.length - 1) {
        console.log(`📊 Progress: ${i + 1}/${odooProducts.length} Odoo products processed (${Math.round(((i + 1) / odooProducts.length) * 100)}%)`);
      }
      
      try {
        // Get pre-fetched store product data (no database query needed!)
        const storeProduct = storeProductMap.get(odooProduct.id);
        
        if (!storeProduct) {
          console.log(`⚠️ No store product found for Odoo product ${odooProduct.id}, skipping...`);
          continue;
        }
        
        // Debug: Show what we're comparing
        if (i < 5) { // Only show first 5 for debugging
          console.log(`🔍 Product ${i + 1}: Odoo ID=${odooProduct.id}, Store ID=${storeProduct._id}`);
          if (allowed.price) {
            console.log(`💰 Price comparison: Store=${storeProduct.price}, Odoo=${odooProduct.list_price}`);
          }
          if (allowed.stock) {
            console.log(`📊 Stock comparison: Store=${storeProduct.stock}, Odoo=${odooProduct.qty_available}`);
          }
        }
        
        const updateData = {};

        if (allowed.name && odooProduct.name) {
          const titleObj = require('./../services/odooImportService').prototype.splitBilingualName
            ? require('./../services/odooImportService').prototype.splitBilingualName(odooProduct.name)
            : { en: odooProduct.name };
          updateData.title = titleObj;
        }

        if (allowed.price && odooProduct.list_price) {
          updateData.price = odooProduct.list_price || 0;
          updateData.originalPrice = odooProduct.standard_price || odooProduct.list_price || 0;
          console.log(`💰 Updating price for product ${storeProduct._id}: ${odooProduct.list_price}`);
        }

        if (allowed.stock) {
          // Get pre-fetched stock data (no database query needed!)
          const stockRecords = stockMap.get(odooProduct.id) || [];
          
          if (stockRecords.length > 0) {
            // Calculate total stock across all locations
            const totalStock = stockRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
            const totalAvailable = stockRecords.reduce((sum, record) => sum + (record.available_quantity || 0), 0);
            
            updateData.stock = totalStock;
            updateData.availableStock = totalAvailable;
            
            console.log(`📊 Product ${storeProduct._id} stock: Total=${totalStock}, Available=${totalAvailable}, Locations=${stockRecords.length}`);
          } else {
            // Fallback to qty_available if no OdooStock records
            const stockQty = odooProduct.qty_available || 0;
            updateData.stock = stockQty;
            updateData.availableStock = stockQty;
            console.log(`⚠️ No OdooStock records for product ${storeProduct._id}, using qty_available: ${stockQty}`);
          }
        }

        // 🚀 Use pre-fetched category map only (no on-demand imports)
        if (allowed.categories && storeProduct.category) {
          const odooCategoryId = categoryMap.get(storeProduct.category);
          if (odooCategoryId) {
            updateData.category = odooCategoryId;
            updateData.categories = [odooCategoryId];
          }
        }

        // 🚀 PERFORMANCE OPTIMIZATION: Collect bulk operations
        if (Object.keys(updateData).length > 0) {
          if (i < 5) { // Debug: Show what we're updating
            console.log(`✅ Adding to bulk update for product ${storeProduct._id}:`, updateData);
          }
          bulkOps.push({
            updateOne: {
              filter: { _id: storeProduct._id },
              update: { $set: updateData }
            }
          });
        } else {
          if (i < 5) { // Debug: Show why no update
            console.log(`⚠️ No update data for product ${storeProduct._id} - all fields unchanged or empty`);
          }
        }

        // Collect units for batch processing
        if (allowed.units) {
          unitsToSync.push({ ...odooProduct, store_product_id: storeProduct._id.toString() });
        }

      } catch (pErr) {
        console.error('Sync error for product', odooProduct?.id || 'unknown', pErr);
        errors.push(pErr.message);
      }
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Execute bulk update
    if (bulkOps.length > 0) {
      console.log(`🚀 Executing bulk update for ${bulkOps.length} products...`);
      console.log(`🔍 Sample bulk operations:`, bulkOps.slice(0, 3));
      
      const bulkResult = await Product.bulkWrite(bulkOps);
      updated = bulkResult.modifiedCount || bulkResult.nModified || 0;
      console.log(`✅ Bulk update completed: ${updated} products updated`);
      console.log(`📊 Bulk result details:`, {
        matchedCount: bulkResult.matchedCount,
        modifiedCount: bulkResult.modifiedCount,
        upsertedCount: bulkResult.upsertedCount,
        nModified: bulkResult.nModified
      });
    } else {
      console.log(`⚠️ No bulk operations to execute - no products need updates`);
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Update ProductUnit stock for products with stock changes
    if (allowed.stock) {
      console.log(`🔄 Updating ProductUnit stock for ${allStoreProducts.length} products...`);
      const ProductUnit = require('../models/ProductUnit');
      
      let unitsUpdated = 0;
      const unitBulkOps = [];
      
      for (const storeProduct of allStoreProducts) {
        try {
          // Get pre-fetched Odoo product data
          const odooProduct = storeProductMap.get(storeProduct.odoo_id);
          if (!odooProduct) continue;
          
          // Get pre-fetched stock data
          const stockRecords = stockMap.get(odooProduct.id) || [];
          
          if (stockRecords.length > 0) {
            // Calculate total stock across all locations
            const totalStock = stockRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
            const totalAvailable = stockRecords.reduce((sum, record) => sum + (record.available_quantity || 0), 0);
            
            // Prepare update data for ProductUnits
            const unitUpdateData = { 
              stock: totalStock,
              availableStock: totalAvailable
            };
            
            // Also update prices if price sync is enabled
            if (allowed.price && odooProduct.list_price) {
              // 🔧 FIX: Only update the DEFAULT unit price, not all units
              // This ensures consistency between product price and default unit price
              unitUpdateData.price = odooProduct.list_price;
              unitUpdateData.originalPrice = odooProduct.list_price;
              
              // Update the filter to only target the DEFAULT unit
              unitBulkOps.push({
                updateOne: {
                  filter: { 
                    product: storeProduct._id,
                    isDefault: true  // Only update the DEFAULT unit
                  },
                  update: { $set: unitUpdateData }
                }
              });
              
              console.log(`💰 Updating DEFAULT ProductUnit price for product ${storeProduct._id}: ${odooProduct.list_price}`);
            } else {
              // If not updating price, update all units for stock only
              unitBulkOps.push({
                updateMany: {
                  filter: { product: storeProduct._id },
                  update: { $set: unitUpdateData }
                }
              });
            }
          }
        } catch (unitErr) {
          console.warn('⚠️ ProductUnit stock update error for product', storeProduct._id, unitErr.message);
        }
      }
      
      // Execute bulk update for ProductUnits
      if (unitBulkOps.length > 0) {
        console.log(`🚀 Executing bulk update for ${unitBulkOps.length} ProductUnits...`);
        const unitBulkResult = await ProductUnit.bulkWrite(unitBulkOps);
        unitsUpdated = unitBulkResult.modifiedCount || 0;
        console.log(`✅ ProductUnit bulk update completed: ${unitsUpdated} units updated`);
      }
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Update ProductUnit prices separately (even if stock not selected)
    if (allowed.price) {
      console.log(`💰 Updating ProductUnit prices for ${allStoreProducts.length} products...`);
      const ProductUnit = require('../models/ProductUnit');
      
      let priceUnitsUpdated = 0;
      const priceBulkOps = [];
      
      for (const storeProduct of allStoreProducts) {
        try {
          // Get pre-fetched Odoo product data
          const odooProduct = storeProductMap.get(storeProduct.odoo_id);
          
          if (!odooProduct || !odooProduct.list_price) continue;
          
          // 🔧 FIX: Only update the DEFAULT unit price to match product price
          // This ensures the default unit always shows the correct price
          priceBulkOps.push({
            updateOne: {
              filter: { 
                product: storeProduct._id,
                isDefault: true  // Only update the DEFAULT unit
              },
              update: { 
                $set: { 
                  price: odooProduct.list_price,
                  originalPrice: odooProduct.list_price
                } 
              }
            }
          });
          
          console.log(`💰 Queuing DEFAULT unit price update for product ${storeProduct._id}: ${odooProduct.list_price}`);
        } catch (priceErr) {
          console.warn('⚠️ ProductUnit price update error for product', storeProduct._id, priceErr.message);
        }
      }
      
      // Execute bulk update for DEFAULT ProductUnit prices only
      if (priceBulkOps.length > 0) {
        console.log(`🚀 Executing bulk update for ${priceBulkOps.length} DEFAULT ProductUnit prices...`);
        const priceBulkResult = await ProductUnit.bulkWrite(priceBulkOps);
        priceUnitsUpdated = priceBulkResult.modifiedCount || 0;
        console.log(`✅ DEFAULT ProductUnit price bulk update completed: ${priceUnitsUpdated} units updated`);
      }
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Batch process units
    if (allowed.units && unitsToSync.length > 0) {
      console.log(`🔄 Processing units for ${unitsToSync.length} products...`);
            const importService = require('../services/odooImportService');
      
      // Get all store products in one query
      const storeProductIds = unitsToSync.map(unit => unit.store_product_id);
      const storeProductsForUnits = await Product.find({ _id: { $in: storeProductIds } }).lean();
      const storeProductMapForUnits = new Map(storeProductsForUnits.map(sp => [sp._id.toString(), sp]));

      // Process units in batches
      const batchSize = 10;
      for (let i = 0; i < unitsToSync.length; i += batchSize) {
        const batch = unitsToSync.slice(i, i + batchSize);
        await Promise.all(batch.map(async (op) => {
          try {
            const storeProd = storeProductMapForUnits.get(op.store_product_id.toString());
            if (storeProd) {
            await importService.importProductUnits(op, storeProd);
            }
          } catch (unitErr) {
            console.warn('Unit sync error for product', op.id, unitErr.message);
          }
        }));
      }
    }

    // Promotions sync (unchanged - already optimized)
    let promosUpdated = 0;
    if (allowed.promotions) {
      console.log('🎯 Starting promotions sync...');
      const importService = require('../services/odooImportService');
      const OdooPricelistItem = require('../models/OdooPricelistItem');
      const Promotion = require('../models/Promotion');

      const plcFilter = { compute_price: 'fixed' };
      const plcItems = await OdooPricelistItem.find(plcFilter);
      console.log(`📋 Found ${plcItems.length} pricelist items for promotion sync`);

      const toImportIds = [];
      for (const plc of plcItems) {
        try {
          if (!plc.store_promotion_id) {
            toImportIds.push(plc.id);
            continue;
          }
          const promo = await Promotion.findById(plc.store_promotion_id);
          if (!promo) continue;

          const updateData = {};
          if (plc.fixed_price !== undefined) updateData.value = plc.fixed_price;
          updateData.minQty = plc.min_quantity || 1;
          updateData.maxQty = plc.max_quantity || null;
          if (plc.date_start) updateData.startDate = plc.date_start;
          if (plc.date_end) updateData.endDate = plc.date_end;
          await promo.set(updateData).save();
          promosUpdated++;
        } catch (prErr) {
          console.warn('Promotion sync error', prErr.message);
          errors.push(prErr.message);
        }
      }

      if (toImportIds.length) {
        try {
          const resImp = await importService.importPromotions(toImportIds);
          promosUpdated += resImp.imported;
          if (resImp.errors?.length) errors.push(...resImp.errors);
        } catch (impErr) {
          errors.push(impErr.message);
        }
      }
    }

    const totalUnitsUpdated = (unitsUpdated || 0) + (priceUnitsUpdated || 0);
    const totalProcessed = odooProducts.length;
    
    console.log(`✅ Sync completed: ${updated}/${totalProcessed} products updated, ${totalUnitsUpdated} units updated (${unitsUpdated || 0} stock, ${priceUnitsUpdated || 0} price), ${promosUpdated} promotions updated, ${errors.length} errors`);
    
    res.json({ 
      success: true, 
      updated, 
      totalProcessed,
      unitsUpdated: totalUnitsUpdated, 
      priceUnitsUpdated: priceUnitsUpdated || 0, 
      promosUpdated, 
      errors,
      message: `Successfully synced ${updated} out of ${totalProcessed} products. ${totalUnitsUpdated} units updated.`
    });
  } catch (error) {
    console.error('SyncToStore error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Import pricelist items (fixed price) to store promotions
 */
const importPromotions = async (req, res) => {
  try {
    const { itemIds = [] } = req.body || {};
    const user = req.admin;

    const result = await odooImportService.importPromotions(itemIds, user);

    res.status(200).json({
      success: result.errors.length === 0,
      message: `Imported ${result.imported} promotions${result.errors.length ? ` with ${result.errors.length} errors` : ''}`,
      data: result,
    });
  } catch (error) {
    console.error('Error importing promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import promotions',
      error: error.message,
    });
  }
};

/**
 * Import all Odoo categories to store
 */
const importAllOdooCategories = async (req, res) => {
  try {
    console.log('🔍 Import all Odoo categories request received');
    
    const user = req.admin;
    
    console.log('🚀 Starting import of all Odoo categories...');
    
    // Import all categories (no specific categoryIds means import all)
    const result = await odooImportService.importCategories();
    
    console.log('✅ Category import completed with results:', result);
    
    res.status(200).json({
      success: true,
      message: `Successfully imported ${result.imported} categories`,
      data: {
        imported: result.imported,
        errors: result.errors,
        total: result.imported + result.errors.length
      },
    });
  } catch (error) {
    console.error('❌ Error importing all Odoo categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import Odoo categories',
      error: error.message,
    });
  }
};

/**
 * List internal (branch) locations from Odoo
 */
const getOdooBranches = async (req, res) => {
  try {
    console.log('🚀 getOdooBranches called');
    
    // First, let's see what usage values exist in Odoo
    console.log('📡 Fetching all locations from Odoo...');
    const allLocations = await odooService.searchRead(
      'stock.location',
      [],
      ['id', 'complete_name', 'usage'],
      0,
      500
    );
    
    console.log('🔍 All Odoo location usages found:', [...new Set(allLocations.map(l => l.usage))]);
    console.log('🔍 Total locations found:', allLocations.length);
    
    // Filter to include internal and any other relevant usages
    const relevantUsages = ['internal', 'inventory', 'inventory_loss', 'loss', 'view'];
    const locations = allLocations.filter(l => relevantUsages.includes(l.usage));
    
    console.log(`📊 Found ${locations.length} locations with relevant usages:`, locations.map(l => ({ id: l.id, name: l.complete_name, usage: l.usage })));
    
    const branches = locations.map((l) => ({ id: l.id, name: l.complete_name, usage: l.usage }));
    console.log('✅ Returning branches:', branches);
    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('❌ Error fetching Odoo branches:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Push accumulated stock changes back to Odoo
 * Body: { locationId }
 */
const pushBackStock = async (req, res) => {
  const sourceLocationId = req.body?.sourceLocationId;
  const destinationLocationId = req.body?.destinationLocationId;

  if (!sourceLocationId || !destinationLocationId) {
    return res.status(400).json({ success: false, message: 'Both sourceLocationId and destinationLocationId are required.' });
  }

  try {
    console.log('🚀 pushBackStock called with:', { sourceLocationId, destinationLocationId });
    console.log('🔍 DEBUG: Request user:', req.user ? `ID: ${req.user._id}, Name: ${req.user.name}` : 'No user in request');

    // Resolve admin user
    let adminUser = null;
    if (req.user && req.user._id) {
      adminUser = await Admin.findById(req.user._id);
    }
    if (!adminUser) {
      adminUser = await Admin.findOne({});
      if (!adminUser) {
        return res.status(500).json({ success: false, message: 'No admin user found. Please create an admin account first.' });
      }
    }

    // Find units with pending quantity before creating a session
    const units = await ProductUnit.find({ pendingOdooQty: { $ne: 0 } }).populate('product');
    if (!units || units.length === 0) {
      return res.status(400).json({ success: false, message: "There isn't any unit to push" });
    }

    // Create a stock push session to track this operation
    const sessionId = `SPS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = new StockPushSession({
      name: `Stock Push - ${sourceLocationId} to ${destinationLocationId}`,
      description: `Automatic stock push from location ${sourceLocationId} to ${destinationLocationId}`,
      initiatedBy: adminUser._id,
      status: 'in_progress',
      sessionId,
      settings: {
        pushStock: true,
        pushPricing: false,
        pushCategories: false,
        forceUpdate: false,
        sourceLocationId: Number(sourceLocationId),
        destinationLocationId: Number(destinationLocationId),
      }
    });
    session.totalProducts = units.length;
    await session.save();

    let pushed = 0;
    const errors = [];
    let totalQuantity = 0;

    // Get branch names (safe-guarded)
    let sourceLocationName = 'Unknown';
    let destinationLocationName = 'Unknown';
    try {
      const branches = await odooService.getBranches();
      const sourceBranch = branches.find(b => b.id === parseInt(sourceLocationId));
      const destBranch = branches.find(b => b.id === parseInt(destinationLocationId));
      if (sourceBranch) sourceLocationName = sourceBranch.name;
      if (destBranch) destinationLocationName = destBranch.name;
    } catch (_) {}

    const detailedReport = {
      summary: { totalUnits: units.length, successfulPushes: 0, failedPushes: 0, totalQuantity: 0 },
      successfulTransfers: [],
      failedTransfers: [],
      sourceLocation: sourceLocationId,
      sourceLocationName,
      destinationLocation: destinationLocationId,
      destinationLocationName,
      timestamp: new Date().toISOString()
    };

    for (const unit of units) {
      const qty = unit.pendingOdooQty;
      if (qty === 0) continue;

      try {
        let productIdForStock = null;
        let uomId = null;
        let odooProductName = null;
        let odooUnitName = null;

        // First, try to find product through StockMovementLog for combo deals
        const stockMovement = await StockMovementLog.findOne({ 
          product: unit.product, 
          odoo_sync_status: 'pending',
          is_combo_deal: true 
        }).sort({ movement_date: -1 });

        if (stockMovement && stockMovement.odoo_id) {
          productIdForStock = stockMovement.odoo_id;
          odooProductName = stockMovement.product_title || 'Combo Product';
          console.log(`🎯 Found combo deal product through StockMovementLog: ${odooProductName} (Odoo ID: ${productIdForStock})`);
        }

        // If not found through stock movement, try OdooBarcodeUnit
        let bu = null; // Declare bu in wider scope
        if (!productIdForStock) {
          bu = await OdooBarcodeUnit.findOne({ store_product_unit_id: unit._id });
          if (bu && bu.product_id) {
            productIdForStock = bu.product_id;
            odooProductName = bu.product_name || 'Unknown Product';
            odooUnitName = bu.unit_name || 'Unknown Unit';
            console.log(`🎯 Found product through OdooBarcodeUnit: ${odooProductName} (Odoo ID: ${productIdForStock})`);
          }
        }

        // If still not found, try OdooProduct
        if (!productIdForStock) {
          const op = await OdooProduct.findOne({ store_product_id: unit.product });
          if (op && op.id) {
            productIdForStock = op.id;
            odooProductName = op.name || 'Unknown Product';
            console.log(`🎯 Found product through OdooProduct: ${odooProductName} (Odoo ID: ${productIdForStock})`);
          }
        }

        // If still not found, try to get from Product model directly
        if (!productIdForStock) {
          const Product = require('../models/Product');
          const product = await Product.findById(unit.product).select('odoo_id title');
          if (product && product.odoo_id) {
            productIdForStock = product.odoo_id;
            odooProductName = product.title?.en || product.title || 'Store Product';
            console.log(`🎯 Found product through Product model: ${odooProductName} (Odoo ID: ${productIdForStock})`);
          }
        }

        // Check if we have barcode unit info for UOM
        if (bu && bu.unit) {
          const unitValue = parseInt(bu.unit);
          if (!isNaN(unitValue) && unitValue > 0) {
            uomId = unitValue;
          }
        }
        if (!productIdForStock) throw new Error('No Odoo mapping for this unit or its parent product');

        await odooService.createAndValidatePicking(
          productIdForStock,
          sourceLocationId,
          destinationLocationId,
          qty,
          uomId
        );

        await unit.set({ pendingOdooQty: 0 }).save();
        pushed += 1;
        totalQuantity += qty;

        // Persist item summary on session
        session.products_summary.push({
          product: unit.product?._id,
          productTitle: unit.product?.title,
          unitId: unit._id,
          unitName: unit.name || unit.title,
          quantity_before: (unit.currentStock || 0) - qty,
          quantity_after: unit.currentStock || 0,
          total_changed: qty,
          invoice_numbers: [],
          sync_status: 'synced',
          odoo: { productId: productIdForStock, productName: odooProductName, unitName: odooUnitName }
        });
        await session.addSuccessLog(
          unit.product?._id?.toString() || 'Unknown',
          unit.product?.title || 'Unknown Product',
          productIdForStock.toString()
        );

        detailedReport.successfulTransfers.push({
          storeProductId: unit.product?._id || 'Unknown',
          storeProductName: unit.product?.title || 'Unknown Product',
          storeUnitId: unit._id,
          storeUnitName: unit.name || unit.title || 'Unknown Unit',
          odooProductId: productIdForStock,
          odooProductName: odooProductName,
          odooUnitName: odooUnitName,
          quantity: qty,
          sourceLocation: sourceLocationId,
          sourceLocationName,
          destinationLocation: destinationLocationId,
          destinationLocationName,
          timestamp: new Date().toISOString()
        });

        detailedReport.summary.successfulPushes++;
        detailedReport.summary.totalQuantity += qty;
      } catch (err) {
        errors.push(`Unit ${unit._id}: ${err.message}`);
        session.products_summary.push({
          product: unit.product?._id,
          productTitle: unit.product?.title,
          unitId: unit._id,
          unitName: unit.name || unit.title,
          quantity_before: unit.currentStock || 0,
          quantity_after: unit.currentStock || 0,
          total_changed: 0,
          invoice_numbers: [],
          sync_status: 'failed',
        });
        await session.addErrorLog(
          unit.product?._id?.toString() || 'Unknown',
          unit.product?.title || 'Unknown Product',
          err.message
        );
        detailedReport.failedTransfers.push({
          storeProductId: unit.product?._id || 'Unknown',
          storeProductName: unit.product?.title || 'Unknown Product',
          storeUnitId: unit._id,
          storeUnitName: unit.name || unit.title || 'Unknown Unit',
          quantity: qty,
          error: err.message,
          timestamp: new Date().toISOString()
        });
        detailedReport.summary.failedPushes++;
      }
    }

    // Finalize session
    session.totalQuantityChanged = totalQuantity;
    session.status = errors.length === 0 ? 'completed' : (pushed > 0 ? 'partial' : 'failed');
    session.completedAt = new Date();
    await session.save();

    res.json({
      success: errors.length === 0,
      pushed,
      errors,
      detailedReport,
      sessionId: session.sessionId,
      sessionStatus: session.status,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: 'An error occurred during the stock push operation',
    });
  }
};

/**
 * Download push back report as CSV
 */
const downloadPushBackReport = async (req, res) => {
  try {
    const { reportData } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ success: false, message: 'Report data is required' });
    }

    // Create CSV content
    let csvContent = 'Product Name,Unit Name,Quantity,Source Location,Destination Location,Status,Error\n';
    
    // Add successful transfers
    reportData.successfulTransfers.forEach(transfer => {
      csvContent += `"${transfer.storeProductName}","${transfer.storeUnitName}","${transfer.quantity}","${transfer.sourceLocationName}","${transfer.destinationLocationName}","Success",""\n`;
    });
    
    // Add failed transfers
    reportData.failedTransfers.forEach(transfer => {
      csvContent += `"${transfer.storeProductName}","${transfer.storeUnitName}","${transfer.quantity}","Unknown","Unknown","Failed","${transfer.error}"\n`;
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="push-back-report-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Sync specific categories with updated prices from Odoo
 * Similar to fetchFromOdoo but only for selected categories
 */
const syncSelectedCategories = async (req, res) => {
  try {
    const { categoryIds = [] } = req.body;
    const user = req.admin;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of category IDs to sync',
      });
    }

    console.log(`🚀 Starting selective category sync for ${categoryIds.length} categories:`, categoryIds);

    const results = [];
    const errors = [];

    // Process each category
    for (const categoryId of categoryIds) {
      try {
        console.log(`\n📂 Processing category ${categoryId}...`);

        // Use the existing syncProductsByCategory method which properly handles prices
        const result = await odooService.syncProductsByCategory(categoryId);
        
        console.log(`🔍 Raw result from syncProductsByCategory:`, result);
        console.log(`🔍 Result structure:`, {
          hasResult: !!result,
          synced: result?.synced,
          total: result?.total,
          category: result?.category,
          type: typeof result
        });
        
        results.push({
          categoryId: parseInt(categoryId),
          success: true,
          syncedProducts: result.synced || 0,
          totalProducts: result.total || 0,
          categoryName: result.category?.name || result.category?.complete_name || `Category ${categoryId}`,
          message: `Successfully synced ${result.synced || 0} products in category ${result.category?.complete_name || categoryId}`
        });

        console.log(`📊 Category ${categoryId} sync result:`, {
          synced: result.synced,
          total: result.total,
          category: result.category
        });

        console.log(`✅ Category ${categoryId} sync completed`);

      } catch (categoryError) {
        console.error(`❌ Error syncing category ${categoryId}:`, categoryError.message);
        errors.push({
          categoryId: parseInt(categoryId),
          error: categoryError.message
        });
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + (r.syncedProducts || 0), 0);
    const successfulCategories = results.length;
    const failedCategories = errors.length;

    // Log the sync operation  
    if (user) {
      const OdooSyncLog = require('../models/OdooSyncLog');
      await OdooSyncLog.create({
        operation_type: 'selective_category_sync',
        data_type: `categories_${categoryIds.join('_')}`,
        status: errors.length === 0 ? 'completed' : 'completed_with_errors',
        started_at: new Date(),
        completed_at: new Date(),
        summary: {
          total: categoryIds.length,
          processed: successfulCategories + failedCategories,
          successful: successfulCategories,
          failed: failedCategories,
          synced_products: totalSynced
        },
        triggered_by: {
          type: 'admin',
          user_id: user._id,
          user_name: user.name || user.email
        }
      });
    }

    res.status(200).json({
      success: errors.length === 0,
      message: `Processed ${categoryIds.length} categories. Successfully synced ${successfulCategories} categories with ${totalSynced} products total`,
      data: {
        results,
        errors,
        summary: {
          totalCategories: categoryIds.length,
          successfulCategories,
          failedCategories,
          totalProductsSynced: totalSynced
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in selective category sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync selected categories',
      error: error.message,
    });
  }
};

module.exports = {
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
  syncSelectedCategories,
}; 