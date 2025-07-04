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
    
    // Start the sync process
    const results = await odooSyncService.fetchFromOdoo(dataTypes, config, user);
    
    res.status(200).json({
      success: true,
      message: 'Data fetch from Odoo completed successfully',
      data: results,
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
    if (category_id) filter.category_id = parseInt(category_id);
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
        // Category
        { $lookup: {
            from: 'odoo_categories',
            localField: 'category_id',
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
        // Barcode units
        { $lookup: {
            from: 'odoo_barcode_units',
            localField: 'product_id',
            foreignField: 'product_id',
            as: 'barcode_units'
        }},
        // Stock
        { $lookup: {
            from: 'odoo_stock',
            localField: 'product_id',
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
    const { importConfig } = req.body;
    const user = req.admin;
    
    if (!importConfig) {
      return res.status(400).json({
        success: false,
        message: 'Import configuration is required',
      });
    }
    
    const results = await odooImportService.importToStore(importConfig, user);
    
    res.status(200).json({
      success: true,
      message: 'Data imported to store successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error importing to store:', error);
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

    const prodFilter = productIds && productIds.length > 0 ? { product_id: { $in: productIds.map(Number) } } : {};

    const odooProducts = await OdooProduct.find(prodFilter).lean();
    let updated = 0;
    const errors = [];

    for (const op of odooProducts) {
      try {
        if (!op.store_product_id) continue;
        const updateData = {};

        if (allowed.name && op.name) {
          const titleObj = require('./../services/odooImportService').prototype.splitBilingualName
            ? require('./../services/odooImportService').prototype.splitBilingualName(op.name)
            : { en: op.name };
          updateData.title = titleObj;
        }

        if ((allowed.price || allowed.stock) && Object.keys(updateData).length === 0) {
          // price & stock handled below
        }

        if (allowed.price) {
          updateData.price = op.list_price || 0;
          updateData.originalPrice = op.standard_price || op.list_price || 0;
        }

        if (allowed.stock) {
          updateData.stock = op.qty_available || 0;
        }

        // categories sync
        let categoryId = null;
        if (allowed.categories && op.category_id) {
          const cat = await OdooCategory.findOne({ id: op.category_id });
          if (cat && cat.store_category_id) {
            categoryId = cat.store_category_id;
          }
        }
        if (categoryId) {
          updateData.category = categoryId;
          updateData.categories = [categoryId];
        }

        // Apply updates
        if (Object.keys(updateData).length > 0) {
          await Product.findByIdAndUpdate(op.store_product_id, updateData);
          updated++;
        }

        // Units sync (re-import units)
        if (allowed.units) {
          try {
            const importService = require('../services/odooImportService');
            const storeProd = await Product.findById(op.store_product_id);
            await importService.importProductUnits(op, storeProd);
          } catch (unitErr) {
            console.warn('Unit sync error for product', op.product_id, unitErr.message);
          }
        }
      } catch (pErr) {
        console.error('Sync error for product', op.product_id, pErr);
        errors.push(pErr.message);
      }
    }

    // Promotions sync
    let promosUpdated = 0;
    if (allowed.promotions) {
      const importService = require('../services/odooImportService');
      const OdooPricelistItem = require('../models/OdooPricelistItem');
      const Promotion = require('../models/Promotion');

      const plcFilter = { compute_price: 'fixed' };
      const plcItems = await OdooPricelistItem.find(plcFilter);

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

    res.json({ success: true, updated, promosUpdated, errors });
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
 * List internal (branch) locations from Odoo
 */
const getOdooBranches = async (req, res) => {
  try {
    const locations = await odooService.searchRead(
      'stock.location',
      [['usage', '=', 'internal']],
      ['id', 'complete_name'],
      0,
      200
    );
    const branches = locations.map((l) => ({ id: l.id, name: l.complete_name }));
    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('Error fetching Odoo branches:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Push accumulated stock changes back to Odoo
 * Body: { locationId }
 */
const pushBackStock = async (req, res) => {
  const bodyLoc = req.body?.locationId;
  const envLoc = process.env.DEDUCT_LOCATION_ID;
  const locationId = bodyLoc || (envLoc ? parseInt(envLoc, 10) : null);

  if (!locationId) {
    return res.status(400).json({ success: false, message: 'locationId is required (either in body or DEDUCT_LOCATION_ID env)' });
  }

  try {
    const units = await ProductUnit.find({ pendingOdooQty: { $ne: 0 } });
    let pushed = 0;
    const errors = [];

    for (const unit of units) {
      const qty = unit.pendingOdooQty;
      if (qty === 0) continue;

      try {
        let productIdForStock = null;

        // 1) Try via barcode unit mapping
        const bu = await OdooBarcodeUnit.findOne({ store_product_unit_id: unit._id });
        if (bu && bu.product_id) {
          productIdForStock = bu.product_id;
        }

        // 2) Fallback – use product mapping if barcode unit not found (e.g. basic unit)
        if (!productIdForStock) {
          const op = await OdooProduct.findOne({ store_product_id: unit.product });
          if (op && op.product_id) {
            productIdForStock = op.product_id;
          }
        }

        if (!productIdForStock) {
          throw new Error('No Odoo mapping for this unit or its parent product');
        }

        // Push the stock adjustment
        await odooService.updateStock(productIdForStock, locationId, qty, 'E-commerce sale');

        // Reset counter locally so it is not re-pushed
        await unit.set({ pendingOdooQty: 0 }).save();
        pushed += 1;
      } catch (err) {
        console.error(`Push-back error for unit ${unit._id}:`, err.message);
        errors.push(`Unit ${unit._id}: ${err.message}`);
      }
    }

    res.json({ success: errors.length === 0, pushed, errors });
  } catch (err) {
    console.error('Push-back stock error:', err);
    res.status(500).json({ success: false, message: err.message });
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
}; 