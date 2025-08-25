const odooService = require('./odooService');
const OdooProduct = require('../models/OdooProduct');
const OdooCategory = require('../models/OdooCategory');
const OdooUom = require('../models/OdooUom');
const OdooStock = require('../models/OdooStock');
const OdooBarcodeUnit = require('../models/OdooBarcodeUnit');
const OdooPricelist = require('../models/OdooPricelist');
const OdooPricelistItem = require('../models/OdooPricelistItem');
const OdooSyncLog = require('../models/OdooSyncLog');

// Store models for importing
const Product = require('../models/Product');
const Category = require('../models/Category');
const Unit = require('../models/Unit');
const ProductUnit = require('../models/ProductUnit');
const Promotion = require('../models/Promotion');

class OdooSyncService {
  constructor() {
    this.batchSize = parseInt(process.env.ODOO_BATCH_SIZE) || 200; // Increased from 100 to 200
    this.maxRetries = parseInt(process.env.ODOO_MAX_RETRIES) || 3;
  }

  /**
   * Test connection to Odoo
   */
  async testConnection() {
    return await odooService.testConnection();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return odooService.getConnectionStatus();
  }

  /**
   * Fetch all data from Odoo and store in odoo_* collections
   */
  async fetchFromOdoo(dataTypes = ['all'], config = {}, user = null) {
    // 🔥 NEW: Check for force refresh flag
    if (config.forceRefresh) {
      console.log(`🔄 Force refresh requested - will perform full sync ignoring incremental settings`);
      config.incremental = false;
    }
    const syncLog = await OdooSyncLog.startSync('fetch_from_odoo', dataTypes.includes('all') ? 'all' : dataTypes.join(','), config, user);
    
    try {
      console.log('🚀 Starting Odoo data fetch...');
      await syncLog.updateOne({ status: 'in_progress' });

      const results = {};
      
      if (dataTypes.includes('all') || dataTypes.includes('categories')) {
        results.categories = await this.fetchCategories(config.incremental);
      }
      
      if (dataTypes.includes('all') || dataTypes.includes('uom')) {
        results.uom = await this.fetchUom(config.incremental);
      }
      
      if (dataTypes.includes('all') || dataTypes.includes('pricelists')) {
        results.pricelists = await this.fetchPricelists(config.incremental);
      }
      
      if (dataTypes.includes('all') || dataTypes.includes('products')) {
        results.products = await this.fetchProducts(config.incremental, config);
      }
      
      if (dataTypes.includes('all') || dataTypes.includes('barcode_units')) {
        results.barcode_units = await this.fetchBarcodeUnits(config.incremental);
      }
      
      if (dataTypes.includes('all') || dataTypes.includes('stock')) {
        results.stock = await this.fetchStock(config.incremental);
      }
      
      if (dataTypes.includes('all') || dataTypes.includes('pricelist_items')) {
        results.pricelist_items = await this.fetchPricelistItems(config.incremental);
      }

      const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0);
      
      // 🔥 NEW: Import pricelist items into store promotions after batch fetch
      if (results.pricelist_items && results.pricelist_items > 0) {
        try {
          console.log(`🎯 Importing ${results.pricelist_items} pricelist items into store promotions...`);
          const odooImportService = require('./odooImportService');
          const importService = new odooImportService();
          
          // Get all pending pricelist items that were just synced
          const pendingItems = await OdooPricelistItem.find({ 
            _sync_status: 'pending',
            last_sync_date: { $gte: new Date(Date.now() - 60000) } // Items synced in last minute
          }).select('id').lean();
          
          if (pendingItems.length > 0) {
            const itemIds = pendingItems.map(item => item.id);
            console.log(`🎯 Importing ${itemIds.length} pricelist items with IDs:`, itemIds);
            
            const importResult = await importService.importPromotions(itemIds);
            console.log(`✅ Import completed:`, importResult);
          }
        } catch (importError) {
          console.error(`⚠️ Warning: Failed to import pricelist items after batch fetch:`, importError);
          // Don't throw error, just log warning - sync succeeded even if import failed
        }
      }
      
      await syncLog.markCompleted({
        total: totalRecords,
        processed: totalRecords,
        successful: totalRecords,
        failed: 0,
        skipped: 0
      });

      console.log('✅ Odoo data fetch completed:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Odoo data fetch failed:', error);
      await syncLog.markFailed(error);
      throw error;
    }
  }

  /**
   * Fetch categories from Odoo
   */
  async fetchCategories(incremental = false) {
    console.log('📂 Fetching categories from Odoo...');
    
    let domain = [];
    if (incremental) {
      const lastSync = await OdooCategory.findOne().sort({ write_date: -1 });
      if (lastSync) {
        domain = [['write_date', '>', lastSync.write_date.toISOString()]];
      }
    }

    // 🚀 OPTIMIZATION: Always filter for active categories by default
    // This prevents fetching inactive/deleted categories unnecessarily
    if (domain.length === 0) {
      domain = [['active', '=', true]];
    } else {
      domain.push(['active', '=', true]);
    }

    console.log(`🔍 Fetching categories with domain:`, domain);

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const categories = await odooService.fetchCategories(domain, this.batchSize, offset);
      
      if (!categories || categories.length === 0) {
        hasMore = false;
        break;
      }

      // Process batch
      const operations = categories.map(category => ({
        updateOne: {
          filter: { id: category.id },
          update: {
            $set: {
              id: category.id,
              name: category.name,
              complete_name: category.complete_name,
              parent_id: category.parent_id ? category.parent_id[0] : null,
              parent_name: category.parent_id ? category.parent_id[1] : null,
              child_ids: category.child_ids || [],
              create_date: category.create_date ? new Date(category.create_date) : new Date(),
              write_date: category.write_date ? new Date(category.write_date) : new Date(),
              _sync_status: 'pending',
              is_active: true,
            }
          },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await OdooCategory.bulkWrite(operations, { ordered: false });
      }

      totalProcessed += categories.length;
      offset += this.batchSize;
      
      if (categories.length < this.batchSize) {
        hasMore = false;
      }

      console.log(`📂 Processed ${totalProcessed} categories...`);
    }

    console.log(`✅ Fetched ${totalProcessed} categories from Odoo`);
    return totalProcessed;
  }

  /**
   * Fetch UoM from Odoo
   */
  async fetchUom(incremental = false) {
    console.log('⚖️ Fetching UoM from Odoo...');
    
    let domain = [];
    if (incremental) {
      const lastSync = await OdooUom.findOne().sort({ write_date: -1 });
      if (lastSync) {
        domain = [['write_date', '>', lastSync.write_date.toISOString()]];
      }
    }

    // 🚀 OPTIMIZATION: Always filter for active UoM by default
    // This prevents fetching inactive/deleted UoM unnecessarily
    if (domain.length === 0) {
      domain = [['active', '=', true]];
    } else {
      domain.push(['active', '=', true]);
    }

    console.log(`🔍 Fetching UoM with domain:`, domain);

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const uoms = await odooService.fetchUom(domain, this.batchSize, offset);
      
      if (!uoms || uoms.length === 0) {
        hasMore = false;
        break;
      }

      const operations = uoms.map(uom => ({
        updateOne: {
          filter: { id: uom.id },
          update: {
            $set: {
              id: uom.id,
              name: uom.name,
              category_id: uom.category_id ? uom.category_id[0] : null,
              category_name: uom.category_id ? uom.category_id[1] : null,
              factor: uom.factor || 1.0,
              factor_inv: uom.factor_inv || 1.0,
              uom_type: uom.uom_type || 'reference',
              rounding: uom.rounding || 0.01,
              active: uom.active !== false,
              create_date: uom.create_date ? new Date(uom.create_date) : new Date(),
              write_date: uom.write_date ? new Date(uom.write_date) : new Date(),
              _sync_status: 'pending',
              is_active: true,
            }
          },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await OdooUom.bulkWrite(operations, { ordered: false });
      }

      totalProcessed += uoms.length;
      offset += this.batchSize;
      
      if (uoms.length < this.batchSize) {
        hasMore = false;
      }

      console.log(`⚖️ Processed ${totalProcessed} UoMs...`);
    }

    console.log(`✅ Fetched ${totalProcessed} UoMs from Odoo`);
    return totalProcessed;
  }

  /**
   * Fetch products from Odoo
   */
  async fetchProducts(incremental = false, options = {}) {
    console.log('\n📦 Starting product sync from Odoo...');
    const { activeOnly = false, types = null, offset: startOffset = 0, limit: maxLimit = null } = options;

    // Build dynamic domain
    let domain = [];
    
    // 🚀 OPTIMIZATION: Always filter for active products by default
    // This prevents fetching inactive/deleted products unnecessarily
    domain.push(['active', '=', true]);
    
    // Add filters if specified
    if (activeOnly) {
      console.log('🔍 Filtering for active products only');
      // Already added above
    }
    if (types && Array.isArray(types) && types.length) {
      console.log('🔍 Filtering for product types:', types);
      domain.push(['type', 'in', types]);
    }
    if (incremental) {
      const lastSync = await OdooProduct.findOne().sort({ write_date: -1 });
      if (lastSync) {
        console.log('🔄 Incremental sync from:', lastSync.write_date.toISOString());
        domain.push(['write_date', '>', lastSync.write_date.toISOString()]);
      }
    }

    // Get total count for progress tracking
    console.log('\n🔍 Getting total product count from Odoo...');
    const totalCount = await odooService.searchCount('product.product', domain);
    console.log(`📊 Total products in Odoo matching criteria: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('ℹ️ No products found matching criteria');
      return 0;
    }

    // Apply batching limits if specified
    let effectiveStartOffset = startOffset || 0;
    let effectiveMaxLimit = maxLimit || totalCount;
    let effectiveEndOffset = Math.min(effectiveStartOffset + effectiveMaxLimit, totalCount);

    console.log(`📊 Batching: Processing products ${effectiveStartOffset} to ${effectiveEndOffset} of ${totalCount}`);

    // Verify count with a small test fetch
    console.log('\n🔍 Verifying search_read access...');
    const testBatch = await odooService.fetchProducts(domain, 1, effectiveStartOffset);
    if (!testBatch || !testBatch.length) {
      throw new Error('Failed to fetch test batch - check Odoo permissions and filters');
    }
    console.log('✅ Search_read test successful');

    let offset = effectiveStartOffset;
    let processedCount = 0;
    const batchSize = 200; // Smaller batch size for reliability
    let failedAttempts = 0;
    const maxRetries = 3;
    
    while (offset < effectiveEndOffset && processedCount < effectiveMaxLimit) {
      try {
        const remainingInBatch = Math.min(batchSize, effectiveEndOffset - offset, effectiveMaxLimit - processedCount);
        
        console.log(`\n🔄 Fetching batch: offset ${offset}, limit ${remainingInBatch}`);
        
        const products = await odooService.fetchProducts(domain, remainingInBatch, offset);
        
        if (!products || products.length === 0) {
          console.log('✅ No more products to fetch');
          break;
        }

        console.log(`📦 Processing ${products.length} products...`);

        // Process products into odoo_products collection
        const operations = products.map(product => {
          // Extract IDs properly
          const categ_id = Array.isArray(product.categ_id) ? product.categ_id[0] : product.categ_id;
          const uom_id = Array.isArray(product.uom_id) ? product.uom_id[0] : product.uom_id;
          const uom_po_id = Array.isArray(product.uom_po_id) ? product.uom_po_id[0] : product.uom_po_id;
          const product_tmpl_id = Array.isArray(product.product_tmpl_id) ? product.product_tmpl_id[0] : product.product_tmpl_id;

          // Clean up default_code
          let default_code = product.default_code;
          if (default_code === false || default_code === 'false' || default_code === undefined) {
            default_code = null;
          }

          return {
            updateOne: {
              filter: { id: product.id },
              update: {
                $set: {
                  ...product,
                  product_tmpl_id,
                  uom_id,
                  uom_po_id,
                  categ_id,
                  default_code,
                  list_price: Number(product.list_price || 0),
                  standard_price: Number(product.standard_price || 0),
                  qty_available: Number(product.qty_available || 0),
                  virtual_available: Number(product.virtual_available || 0),
                  barcode_unit_ids: Array.isArray(product.barcode_unit_ids) ? product.barcode_unit_ids : [],
                  create_date: product.create_date ? new Date(product.create_date) : new Date(),
                  write_date: product.write_date ? new Date(product.write_date) : new Date(),
                  _sync_status: 'pending',
                  is_active: true,
                }
              },
              upsert: true
            }
          };
        });

        if (operations.length > 0) {
          await OdooProduct.bulkWrite(operations, { ordered: false });
        }

        processedCount += products.length;
        offset += products.length;
        failedAttempts = 0; // Reset on success
        
        console.log(`📊 Progress: ${processedCount}/${effectiveMaxLimit} products processed (${Math.round(processedCount/effectiveMaxLimit*100)}%)`);

      } catch (error) {
        failedAttempts++;
        console.error(`❌ Batch failed (attempt ${failedAttempts}/${maxRetries}):`, error.message);
        
        if (failedAttempts >= maxRetries) {
          throw new Error(`Failed to process batch after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * failedAttempts));
      }
    }

    console.log(`✅ Product sync completed: ${processedCount} products processed`);
    return processedCount;
  }

  /**
   * Fetch barcode units from Odoo
   */
  async fetchBarcodeUnits(incremental = false) {
    console.log('🏷️ Fetching barcode units from Odoo...');
    
    let domain = [];
    if (incremental) {
      const lastSync = await OdooBarcodeUnit.findOne().sort({ write_date: -1 });
      if (lastSync) {
        domain = [['write_date', '>', lastSync.write_date.toISOString()]];
      }
    }

    // 🚀 OPTIMIZATION: Add default domain to only fetch active barcode units
    // This prevents fetching inactive/deleted units unnecessarily
    if (domain.length === 0) {
      domain = [['active', '=', true]];
    } else {
      domain.push(['active', '=', true]);
    }

    console.log(`🔍 Fetching barcode units with domain:`, domain);

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const units = await odooService.fetchBarcodeUnits(domain, this.batchSize, offset);
      
      if (!units || units.length === 0) {
        hasMore = false;
        break;
      }

      const operations = units.map(unit => {
        // Use barcode as unique key when available to prevent duplicate-barcode errors.
        const filter = unit.barcode ? { barcode: unit.barcode } : { id: unit.id };
        return {
          updateOne: {
            filter,
            update: {
              $set: {
                id: unit.id,
                name: unit.name,
                sequence: unit.sequence || 10,
                product_id: unit.product_id ? (Array.isArray(unit.product_id) ? unit.product_id[0] : unit.product_id) : null,
                product_tmpl_id: unit.product_tmpl_id ? (Array.isArray(unit.product_tmpl_id) ? unit.product_tmpl_id[0] : unit.product_tmpl_id) : null,
                product_name: unit.product_id ? (Array.isArray(unit.product_id) ? unit.product_id[1] : null) : null,
                barcode: unit.barcode,
                quantity: unit.quantity || 1.0,
                unit: unit.unit ? (Array.isArray(unit.unit) ? unit.unit[1] : unit.unit) : null,
                price: unit.price || 0,
                av_cost: unit.av_cost || 0,
                purchase_qty: unit.purchase_qty || 0,
                purchase_cost: unit.purchase_cost || 0,
                sales_vat: unit.sales_vat || 0,
                sale_qty: unit.sale_qty || 0,
                company_id: unit.company_id ? (Array.isArray(unit.company_id) ? unit.company_id[0] : unit.company_id) : null,
                currency_id: unit.currency_id ? (Array.isArray(unit.currency_id) ? unit.currency_id[0] : unit.currency_id) : null,
                active: unit.active !== false,
                create_date: unit.create_date ? new Date(unit.create_date) : new Date(),
                write_date: unit.write_date ? new Date(unit.write_date) : new Date(),
                _sync_status: 'pending',
                is_active: true,
              }
            },
            upsert: true
          }
        };
      });

      if (operations.length > 0) {
        try {
          await OdooBarcodeUnit.bulkWrite(operations, { ordered: false });
        } catch (bulkErr) {
          // Ignore duplicate key errors and continue processing the remaining batches.
          if (bulkErr?.code !== 11000 && bulkErr?.name !== 'BulkWriteError') {
            throw bulkErr; // re-throw unexpected errors
          }
          console.warn('Duplicate barcode encountered – existing records updated where possible.');
        }
      }

      totalProcessed += units.length;
      offset += this.batchSize;
      
      if (units.length < this.batchSize) {
        hasMore = false;
      }

      console.log(`🏷️ Processed ${totalProcessed} barcode units...`);
    }

    console.log(`✅ Fetched ${totalProcessed} barcode units from Odoo`);
    return totalProcessed;
  }

  /**
   * Fetch pricelists from Odoo
   */
  async fetchPricelists(incremental = false) {
    console.log('💰 Fetching pricelists from Odoo...');
    
    let domain = [];
    if (incremental) {
      const lastSync = await OdooPricelist.findOne().sort({ write_date: -1 });
      if (lastSync) {
        domain = [['write_date', '>', lastSync.write_date.toISOString()]];
      }
    }

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const pricelists = await odooService.fetchPricelists(domain, this.batchSize, offset);
      
      if (!pricelists || pricelists.length === 0) {
        hasMore = false;
        break;
      }

      const operations = pricelists.map(pricelist => ({
        updateOne: {
          filter: { id: pricelist.id },
          update: {
            $set: {
              id: pricelist.id,
              name: pricelist.name,
              currency_id: pricelist.currency_id ? pricelist.currency_id[0] : null,
              currency_name: pricelist.currency_id ? pricelist.currency_id[1] : null,
              company_id: pricelist.company_id ? pricelist.company_id[0] : null,
              company_name: pricelist.company_id ? pricelist.company_id[1] : null,
              discount_policy: pricelist.discount_policy || 'with_discount',
              active: pricelist.active !== false,
              create_date: pricelist.create_date ? new Date(pricelist.create_date) : new Date(),
              write_date: pricelist.write_date ? new Date(pricelist.write_date) : new Date(),
              _sync_status: 'pending',
              is_active: true,
            }
          },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await OdooPricelist.bulkWrite(operations, { ordered: false });
      }

      totalProcessed += pricelists.length;
      offset += this.batchSize;
      
      if (pricelists.length < this.batchSize) {
        hasMore = false;
      }

      console.log(`💰 Processed ${totalProcessed} pricelists...`);
    }

    console.log(`✅ Fetched ${totalProcessed} pricelists from Odoo`);
    return totalProcessed;
  }

  /**
   * Fetch pricelist items from Odoo
   */
  async fetchPricelistItems(incremental = false, forceRefresh = false) {
    // 🔥 NEW: Force refresh option
    if (forceRefresh) {
      console.log(`🔄 Force refresh requested for pricelist items - performing full sync`);
      incremental = false;
    }
    console.log('🎯 Fetching pricelist items from Odoo (Public pricelist only)...');
    
    // 🔥 IMPROVED: Better public pricelist detection and sync
    let publicPricelists = [];
    
    try {
      // First, try to get public pricelists from Odoo directly
      console.log('🔍 Fetching public pricelists from Odoo...');
      const publicListsFromOdoo = await odooService.fetchPricelists([
        ['name', 'ilike', 'public'],
        ['active', '=', true]
      ], 50, 0);
      
      if (publicListsFromOdoo && publicListsFromOdoo.length > 0) {
        console.log(`✅ Found ${publicListsFromOdoo.length} public pricelists from Odoo:`, 
          publicListsFromOdoo.map(pl => ({ id: pl.id, name: pl.name }))
        );
        
        // Upsert them to our local collection
          const plOps = publicListsFromOdoo.map(pl => ({
            updateOne: {
              filter: { id: pl.id },
              update: {
                $set: {
                  id: pl.id,
                  name: pl.name,
                  currency_id: pl.currency_id ? (Array.isArray(pl.currency_id) ? pl.currency_id[0] : pl.currency_id) : null,
                  currency_name: pl.currency_id ? (Array.isArray(pl.currency_id) ? pl.currency_id[1] : null) : null,
                  company_id: pl.company_id ? (Array.isArray(pl.company_id) ? pl.company_id[0] : pl.company_id) : null,
                  company_name: pl.company_id ? (Array.isArray(pl.company_id) ? pl.company_id[1] : null) : null,
                  discount_policy: pl.discount_policy || 'with_discount',
                  active: pl.active !== false,
                  create_date: pl.create_date ? new Date(pl.create_date) : new Date(),
                  write_date: pl.write_date ? new Date(pl.write_date) : new Date(),
                  _sync_status: 'pending',
                  is_active: true,
                }
              },
              upsert: true
            }
          }));
        
        if (plOps.length > 0) {
          await OdooPricelist.bulkWrite(plOps, { ordered: false });
          console.log(`💾 Updated ${plOps.length} public pricelists in local collection`);
        }
        
        publicPricelists = publicListsFromOdoo;
      } else {
        // Fallback: try to get from local collection
        console.log('⚠️ No public pricelists found in Odoo, checking local collection...');
        publicPricelists = await OdooPricelist.find({ 
          name: /public/i,
          active: true 
        }).lean();
        
        if (publicPricelists.length > 0) {
          console.log(`✅ Found ${publicPricelists.length} public pricelists in local collection`);
        }
      }
    } catch (errPl) {
      console.error('❌ Error fetching public pricelists:', errPl.message);
      // Fallback to local collection
      publicPricelists = await OdooPricelist.find({ 
        name: /public/i,
        active: true 
      }).lean();
    }

    const publicIds = publicPricelists.map(pl => pl.id);
    if (publicIds.length === 0) {
      console.warn('❌ No Public pricelist found, skipping pricelist items fetch.');
      return 0;
    }
    
    console.log(`🎯 Will fetch pricelist items for public pricelist IDs:`, publicIds);
    
    // 🔥 IMPROVED: Better domain filtering for pricelist items
    let domain = [
      ['pricelist_id', 'in', publicIds],
      ['active', '=', true] // Only active items
    ];
    
    if (incremental) {
      // 🔥 FIXED: Better incremental sync logic
      const lastSync = await OdooPricelistItem.findOne().sort({ write_date: -1 });
      if (lastSync && lastSync.write_date) {
        // Add buffer time to ensure we catch all changes
        const bufferTime = new Date(lastSync.write_date.getTime() - 60000); // 1 minute buffer
        domain.push(['write_date', '>', bufferTime.toISOString()]);
        console.log(`🔄 Incremental sync: Fetching items updated after ${bufferTime} (with 1min buffer)`);
      } else {
        console.log(`🔄 Full sync: No previous sync found, fetching all items`);
      }
    } else {
      console.log(`🔄 Full sync: Fetching all pricelist items`);
    }
    
    // 🔥 NEW: Always add a safety check for recent changes (last 24 hours)
    const safetyDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    domain.push(['write_date', '>', safetyDate.toISOString()]);
    console.log(`🔄 Safety check: Also fetching items updated in last 24 hours (after ${safetyDate})`);

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const items = await odooService.fetchPricelistItems(domain, this.batchSize, offset);
      
      if (!items || items.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📦 Processing ${items.length} pricelist items (batch ${Math.floor(offset/this.batchSize) + 1})...`);

      // 🔥 NEW: Check for price changes before processing
      console.log(`🔍 Checking for price changes in ${items.length} pricelist items...`);
      for (const item of items) {
        const productId = item.product_id ? (Array.isArray(item.product_id) ? item.product_id[0] : item.product_id) : null;
        if (productId) {
          const existingItem = await OdooPricelistItem.findOne({ id: item.id }).lean();
          if (existingItem && existingItem.fixed_price !== item.fixed_price) {
            console.log(`💰 PRICE CHANGE DETECTED for product ${productId}: ${existingItem.fixed_price} → ${item.fixed_price}`);
          } else if (existingItem) {
            console.log(`✅ Price unchanged for product ${productId}: ${item.fixed_price}`);
          } else {
            console.log(`🆕 New pricelist item for product ${productId}: ${item.fixed_price}`);
          }
        }
      }
      
      const operations = items.map(item => {
        // 🔥 IMPROVED: Better data extraction and validation
        const pricelistId = item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[0] : item.pricelist_id) : null;
        const productId = item.product_id ? (Array.isArray(item.product_id) ? item.product_id[0] : item.product_id) : null;
        const productTmplId = item.product_tmpl_id ? (Array.isArray(item.product_tmpl_id) ? item.product_tmpl_id[0] : item.product_tmpl_id) : null;
        const barcodeUnitId = item.barcode_unit_id ? (Array.isArray(item.barcode_unit_id) ? item.barcode_unit_id[0] : item.barcode_unit_id) : null;
        
        return {
        updateOne: {
          filter: { id: item.id },
          update: {
            $set: {
              id: item.id,
                pricelist_id: pricelistId,
              pricelist_name: item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[1] : null) : null,
                product_tmpl_id: productTmplId,
                product_id: productId,
              product_name: item.product_id ? (Array.isArray(item.product_id) ? item.product_id[1] : null) : null,
                barcode_unit_id: barcodeUnitId,
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
              active: item.active !== false,
              create_date: item.create_date ? new Date(item.create_date) : new Date(),
              write_date: item.write_date ? new Date(item.write_date) : new Date(),
                            _sync_status: 'pending',
              is_active: true,
              // 🔥 NEW: Track when this item was last synced
              last_sync_date: new Date(),
              sync_count: { $inc: 1 } // Increment sync counter
            }
          },
          upsert: true
        }
        };
      });

      if (operations.length > 0) {
        await OdooPricelistItem.bulkWrite(operations, { ordered: false });
      }

      totalProcessed += items.length;
      offset += this.batchSize;
      
      if (items.length < this.batchSize) {
        hasMore = false;
      }

      console.log(`🎯 Processed ${totalProcessed} public pricelist items...`);
    }

    console.log(`✅ Fetched ${totalProcessed} public pricelist items from Odoo`);
    return totalProcessed;
  }

  /**
   * 🔥 NEW: Sync pricelist items for specific category products
   * This ensures that when syncing a category, we also get the latest pricelist promotions
   */
  async syncPricelistItemsForCategory(categoryId, progressCallback = null) {
    try {
      console.log(`🎯 Syncing pricelist items for category ${categoryId}...`);
      
      // Get public pricelist IDs
      const publicPricelists = await OdooPricelist.find({ 
        name: /public/i,
        active: true 
      }).lean();
      
      if (publicPricelists.length === 0) {
        console.log('⚠️ No public pricelists found, skipping category pricelist sync');
        return 0;
      }
      
      const publicIds = publicPricelists.map(pl => pl.id);
      console.log(`🎯 Found ${publicIds.length} public pricelists for category sync`);
      
      // Get products in this category from odoo_products
      const categoryProducts = await OdooProduct.find({ 
        categ_id: categoryId,
        active: true 
      }).select('id').lean();
      
      if (categoryProducts.length === 0) {
        console.log(`⚠️ No products found in category ${categoryId} for pricelist sync`);
        return 0;
      }
      
      const productIds = categoryProducts.map(p => p.id);
      console.log(`🎯 Found ${productIds.length} products in category for pricelist sync`);
      
      // 🔥 FIXED: Always fetch ALL public pricelist items during category sync
      // This ensures we get price updates for any product, not just category-specific ones
      let domain = [
        ['pricelist_id', 'in', publicIds],
        ['active', '=', true]
      ];
      
      console.log(`🔍 Domain for pricelist items:`, JSON.stringify(domain, null, 2));
      console.log(`🎯 Public pricelist IDs:`, publicIds);
      console.log(`🎯 Product IDs in category:`, productIds);
      console.log(`💡 Fetching ALL public pricelist items to ensure price updates are captured`);
      
      // Fetch all public pricelist items (this will include price updates for any product)
      let items = await odooService.fetchPricelistItems(domain, this.batchSize, 0);
      
      if (items && items.length > 0) {
        console.log(`✅ Found ${items.length} public pricelist items (including price updates)`);
      } else {
        console.log(`❌ No public pricelist items found at all`);
        return 0;
      }
      
      let offset = 0;
      let totalProcessed = 0;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`📡 Fetching pricelist items with offset ${offset}, batch size ${this.batchSize}...`);
        const batchItems = await odooService.fetchPricelistItems(domain, this.batchSize, offset);
        
        if (!batchItems || batchItems.length === 0) {
          console.log(`⚠️ No pricelist items found for this batch, stopping...`);
          hasMore = false;
          break;
        }
        
        console.log(`📦 Processing ${batchItems.length} pricelist items...`);
        
        // 🔥 NEW: Check for price changes before processing
        for (const item of batchItems) {
          const productId = item.product_id ? (Array.isArray(item.product_id) ? item.product_id[0] : item.product_id) : null;
          if (productId) {
            const existingItem = await OdooPricelistItem.findOne({ id: item.id }).lean();
            if (existingItem && existingItem.fixed_price !== item.fixed_price) {
              console.log(`💰 PRICE CHANGE DETECTED for product ${productId}: ${existingItem.fixed_price} → ${item.fixed_price}`);
            } else if (existingItem) {
              console.log(`✅ Price unchanged for product ${productId}: ${item.fixed_price}`);
            } else {
              console.log(`🆕 New pricelist item for product ${productId}: ${item.fixed_price}`);
            }
          }
        }
        
        console.log(`📋 Sample items:`, batchItems.slice(0, 2).map(item => ({
          id: item.id,
          product_id: item.product_id,
          pricelist_id: item.pricelist_id,
          fixed_price: item.fixed_price
        })));
        
        const operations = batchItems.map(item => ({
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
                active: item.active !== false,
                create_date: item.create_date ? new Date(item.create_date) : new Date(),
                write_date: item.write_date ? new Date(item.write_date) : new Date(),
                _sync_status: 'pending',
                is_active: true,
                last_sync_date: new Date(),
                category_sync: true, // Mark as synced during category sync
                category_id: categoryId
              }
            },
            upsert: true
          }
        }));
        
        if (operations.length > 0) {
          await OdooPricelistItem.bulkWrite(operations, { ordered: false });
          totalProcessed += operations.length;
          
          if (progressCallback) {
            progressCallback({
              type: 'pricelist_items',
              current: totalProcessed,
              total: items.length,
              status: 'processing'
            });
          }
        }
        
        offset += this.batchSize;
        if (batchItems.length < this.batchSize) {
          hasMore = false;
        }
      }
      
      console.log(`✅ Synced ${totalProcessed} pricelist items for category ${categoryId}`);
      
      // 🔥 NEW: Import the synced pricelist items into store promotions
      if (totalProcessed > 0) {
        try {
          console.log(`🎯 Importing ${totalProcessed} pricelist items into store promotions...`);
          const odooImportService = require('./odooImportService');
          const importService = new odooImportService();
          
          // Get the IDs of items we just synced
          const syncedItems = await OdooPricelistItem.find({ 
            category_sync: true, 
            category_id: categoryId,
            _sync_status: 'pending'
          }).select('id').lean();
          
          if (syncedItems.length > 0) {
            const itemIds = syncedItems.map(item => item.id);
            console.log(`🎯 Importing ${itemIds.length} pricelist items with IDs:`, itemIds);
            
            const importResult = await importService.importPromotions(itemIds);
            console.log(`✅ Import completed:`, importResult);
          }
        } catch (importError) {
          console.error(`⚠️ Warning: Failed to import pricelist items for category ${categoryId}:`, importError);
          // Don't throw error, just log warning - sync succeeded even if import failed
        }
      }
      
      return totalProcessed;
      
    } catch (error) {
      console.error(`❌ Error syncing pricelist items for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch stock from Odoo
   */
  async fetchStock(incremental = false) {
    console.log('📊 Fetching stock from Odoo...');
    
    let domain = [['location_id.usage', 'in', ['internal', 'transit']]];
    if (incremental) {
      const lastSync = await OdooStock.findOne().sort({ write_date: -1 });
      if (lastSync) {
        domain.push(['write_date', '>', lastSync.write_date.toISOString()]);
      }
    }

    // 🚀 OPTIMIZATION: Add additional filters to reduce unnecessary data
    // Only fetch stock with positive quantities to avoid empty records
    domain.push(['quantity', '>', 0]);

    console.log(`🔍 Fetching stock with domain:`, domain);

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const stockItems = await odooService.fetchStock(domain, this.batchSize, offset);
      
      if (!stockItems || stockItems.length === 0) {
        hasMore = false;
        break;
      }

      const operations = stockItems.map(stock => ({
        updateOne: {
          filter: { id: stock.id },
          update: {
            $set: {
              id: stock.id,
              product_id: stock.product_id ? (Array.isArray(stock.product_id) ? stock.product_id[0] : stock.product_id) : null,
              product_name: stock.product_id ? (Array.isArray(stock.product_id) ? stock.product_id[1] : null) : null,
              location_id: stock.location_id ? (Array.isArray(stock.location_id) ? stock.location_id[0] : stock.location_id) : null,
              location_name: stock.location_id ? (Array.isArray(stock.location_id) ? stock.location_id[1] : null) : null,
              quantity: stock.quantity || 0,
              reserved_quantity: stock.reserved_quantity || 0,
              available_quantity: stock.available_quantity || 0,
              lot_id: stock.lot_id ? (Array.isArray(stock.lot_id) ? stock.lot_id[0] : stock.lot_id) : null,
              lot_name: stock.lot_id ? (Array.isArray(stock.lot_id) ? stock.lot_id[1] : null) : null,
              package_id: stock.package_id ? (Array.isArray(stock.package_id) ? stock.package_id[0] : stock.package_id) : null,
              owner_id: stock.owner_id ? (Array.isArray(stock.owner_id) ? stock.owner_id[0] : stock.owner_id) : null,
              create_date: stock.create_date ? new Date(stock.create_date) : new Date(),
              write_date: stock.write_date ? new Date(stock.write_date) : new Date(),
              _sync_status: 'pending',
              is_active: true,
            }
          },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await OdooStock.bulkWrite(operations, { ordered: false });
      }

      totalProcessed += stockItems.length;
      offset += this.batchSize;
      
      if (stockItems.length < this.batchSize) {
        hasMore = false;
      }

      console.log(`📊 Processed ${totalProcessed} stock items...`);
    }

    console.log(`✅ Fetched ${totalProcessed} stock items from Odoo`);
    return totalProcessed;
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics() {
    const stats = {
      products: await OdooProduct.countDocuments({ is_active: true }),
      categories: await OdooCategory.countDocuments({ is_active: true }),
      uom: await OdooUom.countDocuments({ is_active: true }),
      pricelists: await OdooPricelist.countDocuments({ is_active: true }),
      pricelist_items: await OdooPricelistItem.countDocuments({ is_active: true }),
      stock: await OdooStock.countDocuments({ is_active: true }),
      barcode_units: await OdooBarcodeUnit.countDocuments({ is_active: true }),
    };

    const pendingStats = {
      products: await OdooProduct.countDocuments({ _sync_status: 'pending', is_active: true }),
      categories: await OdooCategory.countDocuments({ _sync_status: 'pending', is_active: true }),
      uom: await OdooUom.countDocuments({ _sync_status: 'pending', is_active: true }),
      pricelists: await OdooPricelist.countDocuments({ _sync_status: 'pending', is_active: true }),
      pricelist_items: await OdooPricelistItem.countDocuments({ _sync_status: 'pending', is_active: true }),
      stock: await OdooStock.countDocuments({ _sync_status: 'pending', is_active: true }),
      barcode_units: await OdooBarcodeUnit.countDocuments({ _sync_status: 'pending', is_active: true }),
    };

    const lastSync = await OdooSyncLog.findOne({ operation_type: 'fetch_from_odoo', status: 'completed' })
      .sort({ completed_at: -1 });

    return {
      total_records: stats,
      pending_import: pendingStats,
      last_fetch: lastSync ? {
        date: lastSync.completed_at,
        duration: lastSync.duration_ms,
        success_rate: lastSync.success_rate,
      } : null,
    };
  }
}

module.exports = new OdooSyncService(); 