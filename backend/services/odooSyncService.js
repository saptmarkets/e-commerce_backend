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
    this.batchSize = parseInt(process.env.ODOO_BATCH_SIZE) || 100;
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
        results.products = await this.fetchProducts(config.incremental);
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
  async fetchProducts(incremental = false) {
    console.log('📦 Fetching products from Odoo...');
    
    let domain = [['type', 'in', ['product', 'consu']], ['active', '=', true]];
    if (incremental) {
      const lastSync = await OdooProduct.findOne().sort({ write_date: -1 });
      if (lastSync) {
        domain.push(['write_date', '>', lastSync.write_date.toISOString()]);
      }
    }

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const products = await odooService.fetchProducts(domain, this.batchSize, offset);
      
      if (!products || products.length === 0) {
        hasMore = false;
        break;
      }

      const operations = products.map(product => ({
        updateOne: {
          filter: { id: product.id },
          update: {
            $set: {
              id: product.id,
              // Ensure numeric template ID (Odoo returns [id, name])
              product_tmpl_id: Array.isArray(product.product_tmpl_id) ? product.product_tmpl_id[0] : product.product_tmpl_id,
              product_id: product.id,
              name: product.name,
              default_code: product.default_code,
              barcode: product.barcode,
              list_price: product.list_price || 0,
              standard_price: product.standard_price || 0,
              qty_available: product.qty_available || 0,
              virtual_available: product.virtual_available || 0,
              category_id: product.categ_id ? product.categ_id[0] : null,
              uom_id: product.uom_id ? product.uom_id[0] : null,
              uom_po_id: product.uom_po_id ? product.uom_po_id[0] : null,
              type: product.type,
              sale_ok: product.sale_ok,
              purchase_ok: product.purchase_ok,
              active: product.active,
              barcode_unit_ids: product.barcode_unit_ids || [],
              barcode_unit_count: product.barcode_unit_count || 0,
              attributes: product.attributes || [],
              description_sale: product.description_sale,
              weight: product.weight,
              volume: product.volume,
              create_date: product.create_date ? new Date(product.create_date) : new Date(),
              write_date: product.write_date ? new Date(product.write_date) : new Date(),
              _sync_status: 'pending',
              is_active: true,
            }
          },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await OdooProduct.bulkWrite(operations, { ordered: false });
      }

      totalProcessed += products.length;
      offset += this.batchSize;
      
      if (products.length < this.batchSize) {
        hasMore = false;
      }

      console.log(`📦 Processed ${totalProcessed} products...`);
    }

    console.log(`✅ Fetched ${totalProcessed} products from Odoo`);
    return totalProcessed;
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

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const units = await odooService.fetchBarcodeUnits(domain, this.batchSize, offset);
      
      if (!units || units.length === 0) {
        hasMore = false;
        break;
      }

      const operations = units.map(unit => ({
        updateOne: {
          filter: { id: unit.id },
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
      }));

      if (operations.length > 0) {
        await OdooBarcodeUnit.bulkWrite(operations, { ordered: false });
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
  async fetchPricelistItems(incremental = false) {
    console.log('🎯 Fetching pricelist items from Odoo (Public pricelist only)...');
    
    // Determine public pricelist IDs (case-insensitive contains 'public')
    let publicPricelists = await OdooPricelist.find({ name: /public/i }).lean();
    if (!publicPricelists || publicPricelists.length === 0) {
      // Attempt to fetch pricelists again specifically for public
      try {
        const publicListsFromOdoo = await odooService.fetchPricelists([['name', 'ilike', 'public']], 50, 0);
        if (publicListsFromOdoo?.length) {
          publicPricelists = publicListsFromOdoo;
          // Upsert them so we have them locally for next time
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
          if (plOps.length) await OdooPricelist.bulkWrite(plOps, { ordered: false });
        }
      } catch (errPl) {
        console.warn('Could not fetch Public Pricelist directly:', errPl.message);
      }
    }

    const publicIds = publicPricelists.map(pl => pl.id);
    if (publicIds.length === 0) {
      console.warn('No Public pricelist found, skipping pricelist items fetch.');
      return 0;
    }
    
    let domain = [['pricelist_id', 'in', publicIds]];
    if (incremental) {
      const lastSync = await OdooPricelistItem.findOne().sort({ write_date: -1 });
      if (lastSync) {
        domain.push(['write_date', '>', lastSync.write_date.toISOString()]);
      }
    }

    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
      const items = await odooService.fetchPricelistItems(domain, this.batchSize, offset);
      
      if (!items || items.length === 0) {
        hasMore = false;
        break;
      }

      const operations = items.map(item => ({
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
            }
          },
          upsert: true
        }
      }));

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