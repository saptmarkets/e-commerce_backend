const OdooProduct = require('../models/OdooProduct');
const OdooCategory = require('../models/OdooCategory');
const OdooUom = require('../models/OdooUom');
const OdooSyncLog = require('../models/OdooSyncLog');
const OdooBarcodeUnit = require('../models/OdooBarcodeUnit');
const OdooPricelistItem = require('../models/OdooPricelistItem');
const OdooStock = require('../models/OdooStock');

// Store models
const Product = require('../models/Product');
const Category = require('../models/Category');
const Unit = require('../models/Unit');
const ProductUnit = require('../models/ProductUnit');
const Promotion = require('../models/Promotion');

// Comma-separated list of Odoo location_id values that should be considered
// as "branches" for stock aggregation. Configure via env var BRANCH_LOCATION_IDS.
const BRANCH_LOCATION_IDS = (process.env.BRANCH_LOCATION_IDS || '')
  .split(',')
  .map(id => parseInt(id.trim(), 10))
  .filter(Boolean);

class OdooImportService {
  constructor() {
    this.batchSize = 100; // Increased from 50 to 100 for faster processing
  }

  /**
   * Get import preview (dry run)
   */
  async getImportPreview(importConfig) {
    try {
      const { productIds = [], categoryIds = [] } = importConfig || {};

      // Fetch products & categories from Odoo collections
      const products = productIds.length > 0
        ? await OdooProduct.find({ product_id: { $in: productIds.map(Number) } })
        : [];

      const categories = categoryIds.length > 0
        ? await OdooCategory.find({ id: { $in: categoryIds.map(Number) } })
        : [];

      // Identify potential SKU / barcode conflicts in store
      const skuList = products.map(p => p.default_code).filter(Boolean);
      const barcodeList = products.map(p => p.barcode).filter(Boolean);

      const existingSku = await Product.find({ sku: { $in: skuList } }, 'sku').lean();
      const existingBarcode = await Product.find({ barcode: { $in: barcodeList } }, 'barcode').lean();

      return {
        totalProducts: products.length,
        totalCategories: categories.length,
        conflicts: {
          skus: existingSku.map(e => e.sku),
          barcodes: existingBarcode.map(e => e.barcode),
        },
      };
    } catch (error) {
      console.error('Preview error:', error);
      throw new Error(`Preview failed: ${error.message}`);
    }
  }

  /**
   * Import selected data from Odoo collections to store collections
   */
  async importToStore(importConfig, user = null) {
    try {
      const { productIds = [], categoryIds = [] } = importConfig || {};

      let importedCategories = 0;
      let importedProducts = 0;
      let importedUnits = 0;
      const errors = [];

      console.log(`Starting import: ${productIds.length} products, ${categoryIds.length} categories`);

      // CATEGORY IMPORT --------------------------------------------------
      if (categoryIds && categoryIds.length > 0) {
        console.log('Importing categories...');
        try {
          const result = await this.importCategories(categoryIds);
          importedCategories = result.imported;
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
        } catch (error) {
          console.error('Category import error:', error);
          errors.push(`Category import failed: ${error.message}`);
        }
      }

      // PRODUCT IMPORT ---------------------------------------------------
      if (productIds && productIds.length > 0) {
        console.log('Importing products...');
        try {
          const result = await this.importProducts(productIds);
          importedProducts = result.imported;
          importedUnits = result.units;
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
        } catch (error) {
          console.error('Product import error:', error);
          errors.push(`Product import failed: ${error.message}`);
        }
      }

      // LOG --------------------------------------------------------------
      await OdooSyncLog.create({
        operation_type: 'import_to_store',
        data_type: 'products',
        status: errors.length > 0 ? 'failed' : 'completed',
        started_at: new Date(),
        completed_at: new Date(),
        total_records: importedProducts + importedCategories,
        successful_records: importedProducts + importedCategories,
        failed_records: errors.length,
        error_details: errors.length > 0 ? {
          products: importedProducts,
          categories: importedCategories,
          units: importedUnits,
          errors: errors
        } : undefined,
        triggered_by: user ? { 
          user_id: user._id ? user._id : undefined, 
          user_name: user.name?.en || user.email || 'Unknown User',
          trigger_type: 'manual'
        } : { trigger_type: 'manual' },
      });

      const result = {
        categories: importedCategories,
        products: importedProducts,
        units: importedUnits,
      };

      if (errors.length > 0) {
        result.errors = errors;
        result.message = `Import completed with ${errors.length} errors`;
      }

      console.log('Import completed:', result);
      return result;

    } catch (error) {
      console.error('Import service error:', error);
      
      // Log the error
      await OdooSyncLog.create({
        operation_type: 'import_to_store',
        data_type: 'products',
        status: 'failed',
        started_at: new Date(),
        completed_at: new Date(),
        total_records: 0,
        error_message: error.message,
        error_stack: error.stack,
        triggered_by: user ? { 
          user_id: user._id ? user._id : undefined, 
          user_name: user.name?.en || user.email || 'Unknown User',
          trigger_type: 'manual'
        } : { trigger_type: 'manual' },
      });

      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Import categories
   */
  async importCategories(categoryIds = []) {
    // Bilingual path-aware category importer
    const errors = [];
    let imported = 0;

    try {
      // 1) Fetch Odoo categories to process
      const query = categoryIds && categoryIds.length > 0 ? { id: { $in: categoryIds.map(Number) } } : {};
      const odooCats = await OdooCategory.find(query).lean();
      console.log(`Found ${odooCats.length} categories to import (path parser)`);

      // In-memory caches to avoid duplicate DB lookups
      const storeCatCache = new Map(); // key => store _id

      /**
       * Ensure a single store category exists for given segment under parent.
       * Returns the store category _id (creates it if necessary).
       */
      const ensureStoreCategory = async (segmentRaw, parentStoreId = null) => {
        const segmentTrim = (segmentRaw || '').trim();
        if (!segmentTrim) return parentStoreId;

        // Build cache key: segment text + parent
        const cacheKey = `${parentStoreId || 'root'}|${segmentTrim.toLowerCase()}`;
        if (storeCatCache.has(cacheKey)) {
          return storeCatCache.get(cacheKey);
        }

        // Prepare multilingual name & slug
        const nameObj = this.splitBilingualName(segmentTrim);
        const slugBase = (nameObj.en || Object.values(nameObj)[0] || segmentTrim).trim();
        let slug = this.createSlug(slugBase);

        // Guarantee slug uniqueness (simple counter)
        let counter = 1;
        while (await Category.findOne({ slug })) {
          slug = `${this.createSlug(slugBase)}-${counter}`;
          counter++;
        }

        // Attempt to reuse existing category by slug before creating new one
        let storeCat = await Category.findOne({ slug });
        if (!storeCat) {
          const payload = {
            name: nameObj,
            slug,
            status: 'show',
            icon: '',
          };
          if (parentStoreId) payload.parentId = String(parentStoreId);

          storeCat = await Category.create(payload);
          imported++;
          console.log(`Imported category: ${slugBase}`);
        }

        storeCatCache.set(cacheKey, storeCat._id);
        return storeCat._id;
      };

      // 2) Iterate through each Odoo category and build full path
      const processedCatIds = [];
      for (const cat of odooCats) {
        try {
          // Always process; if already mapped just record and continue
          const rawPath = (cat.complete_name || cat.name || '').trim();
          if (!rawPath) {
            console.warn(`⚠️  Category id ${cat.id} has no name, skipping`);
            continue;
          }

          const segments = rawPath.split('/').map((s) => s.trim()).filter(Boolean);
          let parentId = null;
          for (const seg of segments) {
            parentId = await ensureStoreCategory(seg, parentId);
          }

          // Save mapping for leaf category if missing
          if (!cat.store_category_id || String(cat.store_category_id) !== String(parentId)) {
            await OdooCategory.updateOne(
              { _id: cat._id },
              { store_category_id: parentId, _sync_status: 'imported' }
            );
          }
          processedCatIds.push(cat.id);
        } catch (catErr) {
          console.error(`Category import error (ID ${cat.id}):`, catErr.message);
          errors.push(`Category ${cat.name || cat.id}: ${catErr.message}`);
        }
      }

      // 3) Reconcile existing products that were imported earlier but have unknown/missing categories
      try {
        if (processedCatIds.length > 0) {
          console.log('🔄 Reconciling products category assignments for imported Odoo categories...');

          // Build a map: odooCategoryId -> storeCategoryId
          const mappedCats = await OdooCategory.find({ id: { $in: processedCatIds } }, { id: 1, store_category_id: 1 }).lean();
          const odooIdToStoreCat = new Map(mappedCats.filter(c => c.store_category_id).map(c => [Number(c.id), String(c.store_category_id)]));

          if (odooIdToStoreCat.size > 0) {
            // Find Odoo products under these categories that already have a store product mapping
            const odooProducts = await OdooProduct.find({ categ_id: { $in: Array.from(odooIdToStoreCat.keys()) }, store_product_id: { $ne: null } }, { categ_id: 1, store_product_id: 1 }).lean();

            // Identify placeholder/unknown categories in the store by common patterns
            const unknownCats = await Category.find({
              $or: [
                { slug: /unknown/i },
                { 'name.en': /unknown/i },
                { 'name.ar': /غير معروف/i },
                { 'name.en': /uncategor/i },
                { 'name.ar': /غير مصنف/i },
              ]
            }, { _id: 1 }).lean();
            const unknownCatIds = new Set(unknownCats.map(c => String(c._id)));

            // Group store product ids by target store category id
            const storeCatToProductIds = new Map();
            for (const op of odooProducts) {
              const storeCatId = odooIdToStoreCat.get(Number(op.categ_id));
              if (!storeCatId) continue;
              if (!storeCatToProductIds.has(storeCatId)) storeCatToProductIds.set(storeCatId, []);
              storeCatToProductIds.get(storeCatId).push(op.store_product_id);
            }

            // Bulk update per category to minimize roundtrips
            let updatedCount = 0;
            for (const [storeCatId, productIds] of storeCatToProductIds.entries()) {
              if (!productIds || productIds.length === 0) continue;

              const query = {
                _id: { $in: productIds },
                $or: [
                  { category: { $exists: false } },
                  { category: null },
                  { category: { $in: Array.from(unknownCatIds) } },
                ],
              };

              const res = await Product.updateMany(query, { $set: { category: storeCatId, categories: [storeCatId] } });
              updatedCount += res.modifiedCount || 0;
            }

            console.log(`✅ Reconciled product categories: ${updatedCount} products updated`);

            // Fallback reconciliation for remaining Uncategorized using barcode/SKU match within processed categories
            try {
              // Find products currently in unknown categories
              const unknownCatsArr = Array.from(unknownCatIds);
              const unknownProducts = await Product.find({ category: { $in: unknownCatsArr } }, { _id: 1, barcode: 1, sku: 1 }).lean();
              if (unknownProducts && unknownProducts.length > 0) {
                // Build maps for quick lookup
                const barcodeToProductIds = new Map();
                const skuToProductIds = new Map();
                for (const p of unknownProducts) {
                  if (p.barcode) {
                    const key = String(p.barcode).trim();
                    if (!barcodeToProductIds.has(key)) barcodeToProductIds.set(key, []);
                    barcodeToProductIds.get(key).push(p._id);
                  }
                  if (p.sku) {
                    const key = String(p.sku).trim();
                    if (!skuToProductIds.has(key)) skuToProductIds.set(key, []);
                    skuToProductIds.get(key).push(p._id);
                  }
                }

                // Fetch OdooProducts limited to processed categories matching barcodes/SKUs
                const odooMatches = await OdooProduct.find({
                  categ_id: { $in: Array.from(odooIdToStoreCat.keys()) },
                  $or: [
                    { barcode: { $in: Array.from(barcodeToProductIds.keys()) } },
                    { default_code: { $in: Array.from(skuToProductIds.keys()) } },
                  ],
                }, { categ_id: 1, barcode: 1, default_code: 1 }).lean();

                const storeCatToUnknownProducts = new Map();
                for (const op of odooMatches) {
                  const targetStoreCat = odooIdToStoreCat.get(Number(op.categ_id));
                  if (!targetStoreCat) continue;

                  let matchedIds = [];
                  if (op.barcode && barcodeToProductIds.has(String(op.barcode).trim())) {
                    matchedIds.push(...barcodeToProductIds.get(String(op.barcode).trim()));
                  }
                  if (op.default_code && skuToProductIds.has(String(op.default_code).trim())) {
                    matchedIds.push(...skuToProductIds.get(String(op.default_code).trim()));
                  }
                  if (matchedIds.length === 0) continue;

                  if (!storeCatToUnknownProducts.has(targetStoreCat)) storeCatToUnknownProducts.set(targetStoreCat, new Set());
                  const setRef = storeCatToUnknownProducts.get(targetStoreCat);
                  matchedIds.forEach(id => setRef.add(id));
                }

                let fallbackUpdated = 0;
                for (const [storeCatId, idSet] of storeCatToUnknownProducts.entries()) {
                  const ids = Array.from(idSet);
                  if (ids.length === 0) continue;
                  const res2 = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { category: storeCatId, categories: [storeCatId] } }
                  );
                  fallbackUpdated += res2.modifiedCount || 0;
                }
                console.log(`✅ Fallback (barcode/SKU) reconciliation updated ${fallbackUpdated} products`);
              }
            } catch (fbErr) {
              console.warn('⚠️ Fallback reconciliation failed:', fbErr.message);
            }
          }
        }
      } catch (reconErr) {
        console.warn('⚠️ Product category reconciliation skipped due to error:', reconErr.message);
      }

      return { imported, errors };
    } catch (error) {
      console.error('Categories import error:', error);
      throw error;
    }
  }

  /**
   * Import products
   */
  async importProducts(productIds) {

    const errors = [];
    let imported = 0;
    let units = 0;

    try {
  
      const odooProducts = await OdooProduct.find({ id: { $in: productIds.map(Number) } });
      console.log(`📦 Found ${odooProducts.length} products to import from Odoo`);
      console.log('📋 Product IDs found:', odooProducts.map(p => p.id));
      
      // Debug: Check if any products were not found
      const foundIds = odooProducts.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(Number(id)));
      if (missingIds.length > 0) {
        console.warn('⚠️ Products not found in OdooProduct collection:', missingIds);
        
        // Check what's actually in the collection
        const sampleProducts = await OdooProduct.find().limit(5);
        console.log('📋 Sample products in collection:', sampleProducts.map(p => ({ id: p.id, name: p.name })));
      }

      // Auto-import categories for these products first
      console.log('🌳 Auto-importing categories for products...');
      const categoryIds = [...new Set(odooProducts.map(p => p.categ_id).filter(Boolean))];
      console.log('📋 Category IDs to import:', categoryIds);
      
      if (categoryIds.length > 0) {
        try {
          const categoryResult = await this.importCategories(categoryIds);
          console.log(`✅ Auto-imported ${categoryResult.imported} categories`);
          if (categoryResult.errors.length > 0) {
            console.warn('⚠️ Category import warnings:', categoryResult.errors);
          }
        } catch (catErr) {
          console.warn('⚠️ Auto-category import failed:', catErr.message);
        }
      } else {
        console.warn('⚠️ No category IDs found in products');
      }

      for (const p of odooProducts) {
        try {
          console.log(`🔄 Processing product ${p.id}: ${p.name}`);

          // Check if product already exists
          const existing = await Product.findOne({
            $or: [
              { sku: p.default_code },
              { barcode: p.barcode }
            ].filter(condition => Object.values(condition)[0])
          });

          if (existing) {
            console.log(`⚠️  Product already exists: ${p.name} (ID: ${existing._id})`);
            p.store_product_id = existing._id;
            p._sync_status = 'imported';
            await p.save();
            console.log(`✅ Updated existing product mapping: ${p.name}`);
            continue;
          }

          // --- FLEXIBLE CATEGORY PATH HANDLING ---
          let storeCategoryId = null;
          let categoryPathSegments = [];

          // Try to get the full bilingual path from OdooCategory.complete_name
          if (p.categ_id) {
    
            const odooCat = await OdooCategory.findOne({ id: p.categ_id });
            console.log(`📋 Found Odoo category:`, odooCat ? { id: odooCat.id, name: odooCat.name, complete_name: odooCat.complete_name } : 'NOT FOUND');
            
            if (odooCat && odooCat.complete_name) {
              // Split by / and trim
              categoryPathSegments = odooCat.complete_name.split('/').map(s => s.trim()).filter(Boolean);
              console.log(`📋 Category path segments:`, categoryPathSegments);
            } else if (odooCat && odooCat.name) {
              categoryPathSegments = [odooCat.name.trim()];
              console.log(`📋 Using category name as single segment:`, categoryPathSegments);
            }
          }

          // If no path, error
          if (!categoryPathSegments.length) {
            errors.push(`Product ${p.id}: No category path found for category ID ${p.categ_id}`);
            console.error(`❌ Product ${p.id}: No category path found for category ID ${p.categ_id}`);
            continue;
          }

          // Walk the path and create missing categories automatically
          let parentId = null;
  
          
          for (const seg of categoryPathSegments) {
            
            
            // Try to find by both English and Arabic name
            const nameObj = this.splitBilingualName(seg);
            console.log(`📋 Looking for category with names:`, { en: nameObj.en, ar: nameObj.ar, original: seg });
            
            let cat = await Category.findOne({
              $or: [
                { 'name.en': nameObj.en },
                { 'name.ar': nameObj.ar },
                { 'name.en': seg },
                { 'name.ar': seg }
              ],
              ...(parentId ? { parentId: String(parentId) } : {})
            });
            
            if (!cat) {
              console.log(`⚠️ Category segment "${seg}" not found, creating it automatically`);
              
              // Create the missing category
              const slugBase = (nameObj.en || Object.values(nameObj)[0] || seg).trim();
              let slug = this.createSlug(slugBase);
              
              // Ensure slug uniqueness
              let counter = 1;
              while (await Category.findOne({ slug })) {
                slug = `${this.createSlug(slugBase)}-${counter}`;
                counter++;
              }
              
              const categoryPayload = {
                name: nameObj,
                slug,
                status: 'show',
                icon: '',
              };
              if (parentId) categoryPayload.parentId = String(parentId);
              
              cat = await Category.create(categoryPayload);
              console.log(`✅ Created missing category: ${nameObj.en || seg} (ID: ${cat._id})`);
            } else {
              console.log(`✅ Found existing category: ${cat.name?.en || cat.name} (ID: ${cat._id})`);
            }
            
            parentId = cat._id;
          }

          storeCategoryId = parentId;

          // --- END STRICT CATEGORY CHECK ---

          // Resolve basic unit or create default
          let basicUnit = null;
  
          
          if (p.uom_id) {
            const unitMap = await OdooUom.findOne({ id: p.uom_id });
            console.log(`📋 Found OdooUom mapping:`, unitMap ? { id: unitMap.id, store_unit_id: unitMap.store_unit_id } : 'NOT FOUND');
            
            if (unitMap && unitMap.store_unit_id) {
              basicUnit = await Unit.findById(unitMap.store_unit_id);
              console.log(`📋 Found mapped unit:`, basicUnit ? { name: basicUnit.name, shortCode: basicUnit.shortCode } : 'NOT FOUND');
            }
          }
          
          if (!basicUnit) {

            
            // First try to find by name
            basicUnit = await Unit.findOne({ name: 'Piece' });
            
            if (!basicUnit) {
              // Try to find by shortCode
              basicUnit = await Unit.findOne({ shortCode: 'pcs' });
            }
            
            if (!basicUnit) {

              try {
                basicUnit = await Unit.create({
                  name: 'Piece',
                  shortCode: 'pcs',
                  type: 'base',
                  isBase: true,
                  status: 'show'
                });
                console.log(`✅ Created new basic unit:`, { name: basicUnit.name, shortCode: basicUnit.shortCode, id: basicUnit._id });
              } catch (createErr) {
                if (createErr.code === 11000 && createErr.keyPattern?.shortCode) {
                  // Duplicate shortCode error - try to find the existing unit
                  console.log(`⚠️ Duplicate shortCode error, finding existing unit`);
                  basicUnit = await Unit.findOne({ shortCode: 'pcs' });
                  if (basicUnit) {
                    console.log(`✅ Found existing unit with shortCode 'pcs':`, { name: basicUnit.name, id: basicUnit._id });
                  } else {
                    throw new Error(`Failed to create or find unit with shortCode 'pcs'`);
                  }
                } else {
                  throw createErr;
                }
              }
            } else {
              console.log(`✅ Found existing basic unit:`, { name: basicUnit.name, shortCode: basicUnit.shortCode, id: basicUnit._id });
            }
          }

          // Split bilingual name
          const titleObj = this.splitBilingualName(p.name);

          // Aggregate stock from multiple locations
          let locationStocks = [];
          try {
            const stockRecords = await OdooStock.find({ product_id: p.id, is_active: true });
            locationStocks = stockRecords.map(sr => ({
              locationId: sr.location_id,
              name: sr.location_name,
              qty: sr.available_quantity ?? sr.quantity ?? 0,
            }));
            if (BRANCH_LOCATION_IDS.length > 0) {
              locationStocks = locationStocks.filter(ls => BRANCH_LOCATION_IDS.includes(ls.locationId));
            }
          } catch (lsErr) {}
          const totalQty = locationStocks.reduce((acc, ls) => acc + (ls.qty || 0), 0);
          const slugSource = titleObj.en || Object.values(titleObj)[0] || p.name;
          const slug = this.createSlug(slugSource);

          // Create product in store
          console.log(`🔨 Creating product in store:`, {
            sku: p.default_code || `ODOO-${p.id}`,
            name: p.name,
            category: storeCategoryId,
            price: p.list_price || 0,
            basicUnit: basicUnit._id
          });
          
          const newProd = await Product.create({
            sku: p.default_code || `ODOO-${p.id}`,
            barcode: p.barcode,
            title: titleObj,
            slug: slug,
            category: storeCategoryId,
            categories: [storeCategoryId],
            price: p.list_price || 0,
            originalPrice: p.standard_price || p.list_price || 0,
            stock: totalQty,
            locationStocks,
            isCombination: false,
            basicUnitType: 'pcs',
            basicUnit: basicUnit._id,
            status: 'show',
            type: 'simple',
            hasMultiUnits: false,
            availableUnits: [basicUnit._id],
            odooProductId: p.id
          });
          
          console.log(`✅ Product created successfully: ${newProd._id}`);

          // Create ProductUnit for the basic unit (so it appears in More Units tab)
          const basicProductUnit = await ProductUnit.create({
              product: newProd._id,
              unit: basicUnit._id,
            unitType: 'basic',
                unitValue: 1,
                packQty: 1,
                price: newProd.price,
                sku: newProd.sku,
                barcode: newProd.barcode,
            name: basicUnit.name,
                isDefault: true,
                isActive: true,
                isAvailable: true,
                stock: totalQty,
            locationStocks
              });

          console.log(`✅ Created basic ProductUnit ${basicProductUnit._id} for product ${newProd._id}`);

          // Update product to include the basic unit in availableUnits
            await Product.findByIdAndUpdate(newProd._id, {
            availableUnits: [basicProductUnit._id]
          });

          // Import additional units from Odoo barcode units
          try {
            const unitResult = await this.importProductUnits(p, newProd, { 
              stock: totalQty, 
              locationStocks 
            });
            units += unitResult.units;
            console.log(`✅ Imported ${unitResult.units} additional units for product ${newProd._id}`);
          } catch (unitErr) {
            console.error(`⚠️  Error importing units for product ${p.id}:`, unitErr.message);
            errors.push(`Product ${p.id}: Unit import failed - ${unitErr.message}`);
          }

          p.store_product_id = newProd._id;
          p._sync_status = 'imported';
          await p.save();
          imported++;
          
        } catch (pErr) {
          console.error(`❌ Error importing product ${p.id}:`, pErr);
          errors.push(`Product ${p.id}: ${pErr.message}`);
          }
      }

      console.log(`🎉 Import completed: ${imported} products imported, ${units} additional units imported, ${errors.length} errors`);
      
      // Log detailed results
      if (imported > 0) {
        console.log(`✅ Successfully imported ${imported} products`);
      }
      if (units > 0) {
        console.log(`📦 Successfully imported ${units} additional units`);
      }
      if (errors.length > 0) {
        console.log(`❌ Import errors:`, errors);
      }
      
      return { imported, units, errors };

    } catch (error) {
      console.error('❌ Fatal error in importProducts:', error);
      throw error;
    }
  }

  /**
   * Import product units
   */
  async importProductUnits(odooProduct, storeProduct, stockInfo = {}) {
    const { stock = 0, locationStocks = [] } = stockInfo;
    let units = 0;
    const unitIds = [storeProduct.basicUnit]; // Start with basic unit

    try {
      // Import all active barcode units for this product
      let odooUnits = [];
      
      // First try to use barcode_unit_ids if available
      if (odooProduct.barcode_unit_ids && odooProduct.barcode_unit_ids.length > 0) {
        odooUnits = await OdooBarcodeUnit.find({ 
          id: { $in: odooProduct.barcode_unit_ids },
          active: true 
        });
      }
      
      // If no units found by IDs, try product_id lookup
      if (!odooUnits || odooUnits.length === 0) {
        odooUnits = await OdooBarcodeUnit.find({ 
          product_id: odooProduct.id,
          active: true 
        });
      }
      
      // Also try product_tmpl_id if still no units found
      if (!odooUnits || odooUnits.length === 0 && odooProduct.product_tmpl_id) {
        odooUnits = await OdooBarcodeUnit.find({ 
          product_tmpl_id: odooProduct.product_tmpl_id,
          active: true 
        });
      }

      if (!odooUnits || odooUnits.length === 0) {
        return { units, unitIds };
      }

      for (const bu of odooUnits) {
        try {
          // Prefer the descriptive `name` (e.g., CTN12) over generic `unit` field
          const unitName = bu.name || bu.unit || 'Unit';
          const shortCode = this.createShortCode(unitName);

          let storeUnit = await Unit.findOne({ shortCode });
          if (!storeUnit) {
            try {
              storeUnit = await Unit.create({ 
                name: unitName, 
                shortCode, 
                type: 'pack', 
                isBase: false,
                status: 'show'
              });
            } catch (createErr) {
              if (createErr.code === 11000 && createErr.keyPattern?.shortCode) {
                // Duplicate shortCode error - try to find the existing unit
                storeUnit = await Unit.findOne({ shortCode });
                if (!storeUnit) {
                  throw new Error(`Failed to create or find unit with shortCode '${shortCode}'`);
                }
              } else {
                throw createErr;
              }
            }
          }

          // Create ProductUnit if not exists
          let prodUnit = await ProductUnit.findOne({ 
            product: storeProduct._id,
            barcode: bu.barcode 
          });

          if (!prodUnit) {
            // Validate required fields before creation
            if (!storeProduct._id) {
              throw new Error(`Store product ID is missing for barcode unit ${bu.id}`);
            }
            if (!storeUnit._id) {
              throw new Error(`Store unit ID is missing for barcode unit ${bu.id}`);
            }
            
            const productUnitData = {
              product: storeProduct._id,
              unit: storeUnit._id,
              unitType: 'multi',
              unitValue: 1,
              packQty: bu.quantity || 1,
              price: bu.price || storeProduct.price || 0,
              sku: `${storeProduct.sku}-${shortCode}`,
              barcode: bu.barcode,
              name: unitName, // Add the unit name
              isDefault: false,
              isActive: true,
              isAvailable: true,
              stock: stock || 0,
              locationStocks: locationStocks || []
            };
            

            
            prodUnit = await ProductUnit.create(productUnitData);
            
            if (!prodUnit || !prodUnit._id) {
              throw new Error(`Failed to create ProductUnit for barcode unit ${bu.id}`);
            }
            
            units++;
          } else {
            // Ensure stock fields stay in sync for existing units
            await prodUnit.set({
              stock: stock || 0,
              locationStocks: locationStocks || [],
              isActive: true,
              isAvailable: true
            }).save();
          }

          // Update Odoo barcode unit mapping
          bu.store_product_unit_id = prodUnit._id;
          bu._sync_status = 'imported';
          await bu.save();

          if (!unitIds.includes(storeUnit._id)) {
            unitIds.push(storeUnit._id);
          }
          
          // Ensure the ProductUnit is added to the store product's availableUnits array
          if (storeProduct.availableUnits && !storeProduct.availableUnits.includes(prodUnit._id)) {
            storeProduct.availableUnits.push(prodUnit._id);
          }

        } catch (error) {
          console.error(`Error importing barcode unit ${bu.name}:`, error);
          throw error;
        }
      }

      // --- Update product with all created units ---
      try {
        // Wait a moment to ensure all newly created units are properly saved
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get all ProductUnits for this product (both basic and multi)
        const allProductUnits = await ProductUnit.find({
          product: storeProduct._id,
        }, '_id isActive unitType barcode');
        
        // Get only active units for the availableUnits array
        const activeUnits = allProductUnits.filter(u => u.isActive);
        
        // Update the store product with the correct availableUnits
        await Product.findByIdAndUpdate(
          storeProduct._id, 
          {
            availableUnits: activeUnits.map(u => u._id),
            hasMultiUnits: activeUnits.length > 1
          },
          { new: true }
        );
        
        // Ensure the store product object reflects the changes for subsequent operations
        if (storeProduct.availableUnits) {
          storeProduct.availableUnits = activeUnits.map(u => u._id);
        }
        
      } catch (updateErr) {
        console.warn('⚠️  Product update failed:', updateErr.message);
      }

      return { units, unitIds };

    } catch (error) {
      console.error('Product units import error:', error);
      throw error;
    }
  }

  /**
   * Create URL-friendly slug
   */
  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Create short code for units
   */
  createShortCode(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 6) || 'unit';
  }

  /**
   * Split Odoo bilingual name string e.g. "[عربي] [ENGLISH]" into { en, ar }
   */
  splitBilingualName(rawName = '') {
    try {
      if (!rawName) return {};

      const isArabic = (str = '') => /[\u0600-\u06FF]/.test(str);

      // 1) Bracket style [AR] [EN]
      const bracketMatches = rawName.match(/\[(.*?)\]/g);
      if (bracketMatches && bracketMatches.length >= 2) {
        const first = bracketMatches[0].replace(/\[|\]/g, '').trim();
        const second = bracketMatches[1].replace(/\[|\]/g, '').trim();
        if (isArabic(first) && !isArabic(second)) return { ar: first, en: second };
        if (isArabic(second) && !isArabic(first)) return { ar: second, en: first };
        return { en: second, ar: first };
      }

      // 2) Hyphen style EN-AR or AR-EN
      if (rawName.includes('-')) {
        const [left, ...rest] = rawName.split('-');
        const right = rest.join('-').trim();
        const l = left.trim();
        const r = right.trim();
        if (l && r) {
          if (isArabic(l) && !isArabic(r)) return { ar: l, en: r };
          if (isArabic(r) && !isArabic(l)) return { ar: r, en: l };
        }
      }

      // 3) Slash-separated hierarchy – take last segment recursively
      if (rawName.includes('/')) {
        const lastSeg = rawName.split('/').pop().trim();
        if (lastSeg && lastSeg !== rawName) {
          return this.splitBilingualName(lastSeg);
        }
      }

      // 4) Fallback single language detection
      return isArabic(rawName) ? { ar: rawName } : { en: rawName };
    } catch (e) {
      return { en: rawName };
    }
  }

  /**
   * Import promotions (fixed-price) from OdooPricelistItem to Promotion collection
   * Enhanced to handle multi-unit promotions correctly with comprehensive validation
   */
  async importPromotions(itemIds = []) {
    const errors = [];
    let imported = 0;

    // Fetch items
    const itemFilter = { compute_price: 'fixed' };
    if (itemIds && itemIds.length > 0) {
      itemFilter.id = { $in: itemIds.map(Number) };
    }

    const items = await OdooPricelistItem.find(itemFilter).lean();
    console.log(`Found ${items.length} pricelist items to import`);

    // Skip validation for speed - just update existing promotions
    console.log('🚀 Fast sync mode: skipping validation for speed');

    for (const plc of items) {
      try {
        // Skip inactive / expired
        if (plc.date_end && plc.date_end < new Date()) {
          continue;
        }

        // 🔥 FIXED: Check if already imported and UPDATE if needed
        if (plc.store_promotion_id) {
          // Validate that the promotion actually exists
          const existingPromotion = await Promotion.findById(plc.store_promotion_id);
          if (!existingPromotion) {
            console.log(`⚠️  Found invalid store_promotion_id for item ${plc.id}, clearing it...`);
            await OdooPricelistItem.updateOne(
              { id: plc.id },
              { 
                $unset: { store_promotion_id: 1 }, 
                $set: { _sync_status: 'pending', _import_error: null } 
              }
            );
          } else {
            console.log(`🔄 Item ${plc.id} already has valid promotion, checking for price updates...`);
            
            // Check if price needs updating
            const currentPrice = existingPromotion.value;
            const newPrice = plc.fixed_price;
            
            if (currentPrice !== newPrice) {
              console.log(`💰 Price update needed: ${currentPrice} → ${newPrice} for promotion ${existingPromotion._id}`);
              
              // Update the existing promotion with new price
              await Promotion.updateOne(
                { _id: existingPromotion._id },
                { 
                  $set: { 
                    value: newPrice,
                    lastUpdated: new Date(),
                    _last_odoo_sync: new Date(),
                    odoo_pricelist_item_id: plc.id
                  }
                }
              );
              
              console.log(`✅ Updated promotion ${existingPromotion._id} with new price: ${newPrice}`);
              
              // Update sync status
              await OdooPricelistItem.updateOne(
                { id: plc.id },
                { 
                  $set: { 
                    _sync_status: 'updated',
                    _last_price_update: new Date(),
                    _last_sync_date: new Date()
                  }
                }
              );
              
              imported += 1; // Count as updated
              continue; // Skip to next item
            } else {
              console.log(`✅ Promotion ${existingPromotion._id} already has correct price: ${currentPrice}`);
              
              // Update sync status to show it's current
              await OdooPricelistItem.updateOne(
                { id: plc.id },
                { 
                  $set: { 
                    _sync_status: 'current',
                    _last_sync_date: new Date()
                  }
                }
              );
              
              continue; // Skip to next item
            }
          }
        }

        // Resolve the corresponding ProductUnit in store
        let storeProductUnitId = null;

        // 1) Enhanced barcode unit handling - This is the primary path for multi-unit promotions
        if (plc.barcode_unit_id) {
          console.log(`Processing barcode unit promotion for item ${plc.id}, barcode_unit_id: ${plc.barcode_unit_id}`);
          
          const bu = await OdooBarcodeUnit.findOne({ id: plc.barcode_unit_id });
          if (bu) {
            console.log(`Found barcode unit: ${bu.name} (${bu.barcode}) for product ${bu.product_id}`);
            
            // If the barcode unit exists but hasn't been mapped to a store ProductUnit,
            // we need to ensure the product and its units are imported first
            if (!bu.store_product_unit_id) {
              console.log(`Barcode unit ${bu.id} not mapped to store ProductUnit, importing product units...`);
              
              const odooProduct = await OdooProduct.findOne({ id: bu.product_id });  // Changed from product_id to id
              if (odooProduct) {
                // Ensure the product exists in store collections first
                if (!odooProduct.store_product_id) {
                  console.log(`Product ${odooProduct.id} not in store, importing...`);  // Changed from odooProduct.product_id to odooProduct.id
                  try {
                    await this.importProducts([odooProduct.id]);  // Changed from odooProduct.product_id to odooProduct.id
                    await odooProduct.reload();
                  } catch (impErr) {
                    console.warn(`Auto-import product ${odooProduct.id} failed:`, impErr.message);  // Changed from odooProduct.product_id to odooProduct.id
                    throw new Error(`Failed to import product ${odooProduct.id}: ${impErr.message}`);  // Changed from odooProduct.product_id to odooProduct.id
                  }
                }

                // Now import/update all units for this product to ensure the barcode unit gets mapped
                try {
                  console.log(`Importing units for product ${odooProduct.id} to ensure barcode unit mapping...`);  // Changed from odooProduct.product_id to odooProduct.id
                  await this.importProductUnits(odooProduct, { _id: odooProduct.store_product_id });
                  
                  // Reload the barcode unit to get the newly set store_product_unit_id
                  await bu.reload();
                  console.log(`After unit import, barcode unit ${bu.id} store mapping:`, bu.store_product_unit_id);
                } catch (unitImportErr) {
                  console.error(`Auto-import units for product ${odooProduct.id} failed:`, unitImportErr.message);  // Changed from odooProduct.product_id to odooProduct.id
                  throw new Error(`Failed to import units for product ${odooProduct.id}: ${unitImportErr.message}`);  // Changed from odooProduct.product_id to odooProduct.id
                }
              } else {
                throw new Error(`Odoo product not found for barcode unit ${bu.id} (product_id: ${bu.product_id})`);
              }
            }
            
            storeProductUnitId = bu.store_product_unit_id;
            console.log(`Resolved ProductUnit ID: ${storeProductUnitId} for barcode unit ${bu.id}`);
          } else {
            console.warn(`Barcode unit ${plc.barcode_unit_id} not found in OdooBarcodeUnit collection`);
          }
        }

        // 2) When barcode_unit_id is null, handle product-level promotions
        if (!storeProductUnitId && plc.product_id) {
          console.log(`Processing basic unit promotion for item ${plc.id} (barcode_unit_id is null, using basic unit)`);
          const opById = await OdooProduct.findOne({ id: plc.product_id });  // Changed from product_id to id
          if (opById) {
            // Ensure product exists in store collections
            if (!opById.store_product_id) {
              try {
                console.log(`Product ${opById.id} not in store, importing...`);
                await this.importProducts([opById.id]);  // Changed from opById.product_id to opById.id
                await opById.reload();
              } catch (impErr) {
                console.warn('Auto-import product failed', impErr.message);
                throw new Error(`Failed to import product ${opById.id}: ${impErr.message}`);
              }
            }

            if (opById.store_product_id) {
              // Find the basic/default unit for this product
              const defaultPU = await ProductUnit.findOne({ product: opById.store_product_id, isDefault: true });
              if (defaultPU) {
                storeProductUnitId = defaultPU._id;
                console.log(`✅ Resolved basic unit ID: ${storeProductUnitId} for product ${opById.id}`);
              } else {
                // If no default unit exists, try to find any unit for this product
                const anyPU = await ProductUnit.findOne({ product: opById.store_product_id });
                if (anyPU) {
                  storeProductUnitId = anyPU._id;
                  console.log(`✅ Resolved any unit ID: ${storeProductUnitId} for product ${opById.id} (no default unit found)`);
                } else {
                  // If still no unit found, create a basic unit for this product
                  console.log(`⚠️ No units found for product ${opById.id}, creating basic unit...`);
                  try {
                    const basicUnit = await ProductUnit.create({
                      product: opById.store_product_id,
                      unit: await this.getOrCreateBasicUnit(),
                      unitValue: 1,
                      packQty: 1,
                      isDefault: true,
                      price: opById.list_price || 0,
                      stock: 0
                    });
                    storeProductUnitId = basicUnit._id;
                    console.log(`✅ Created basic unit ID: ${storeProductUnitId} for product ${opById.id}`);
                  } catch (unitErr) {
                    console.error(`Failed to create basic unit for product ${opById.id}:`, unitErr.message);
                    throw new Error(`Failed to create basic unit: ${unitErr.message}`);
                  }
                }
              }
            }
          }
        }

        // 3) When both barcode_unit_id and product_id are null, use product_tmpl_id (template-level promotions)
        if (!storeProductUnitId && plc.product_tmpl_id) {
          console.log(`Processing template-level promotion for item ${plc.id} (barcode_unit_id: ${plc.barcode_unit_id}, product_id: ${plc.product_id}, product_tmpl_id: ${plc.product_tmpl_id})`);
          
          // Find any product with this template ID
          const opByTpl = await OdooProduct.findOne({ product_tmpl_id: plc.product_tmpl_id });
          if (opByTpl) {
            console.log(`Found product with template ${plc.product_tmpl_id}: ${opByTpl.name} (ID: ${opByTpl.id})`);
            
            // Ensure product exists in store collections
            if (!opByTpl.store_product_id) {
              try {
                console.log(`Product ${opByTpl.id} not in store, importing...`);
                await this.importProducts([opByTpl.id]);
                await opByTpl.reload();
              } catch (impErr) {
                console.warn('Auto-import product failed', impErr.message);
                throw new Error(`Failed to import product ${opByTpl.id}: ${impErr.message}`);
              }
            }
            
            if (opByTpl.store_product_id) {
              // Find the basic/default unit for this product
              const defaultPU = await ProductUnit.findOne({ product: opByTpl.store_product_id, isDefault: true });
              if (defaultPU) {
                storeProductUnitId = defaultPU._id;
                console.log(`Resolved basic unit ID: ${storeProductUnitId} for template product ${opByTpl.id}`);
              } else {
                // If no default unit exists, try to find any unit for this product
                const anyPU = await ProductUnit.findOne({ product: opByTpl.store_product_id });
                if (anyPU) {
                  storeProductUnitId = anyPU._id;
                  console.log(`Resolved any unit ID: ${storeProductUnitId} for template product ${opByTpl.id} (no default unit found)`);
                }
              }
            }
          } else {
            console.warn(`No product found with template ID ${plc.product_tmpl_id}`);
          }
        }

        if (!storeProductUnitId) {
          throw new Error(`No mapped ProductUnit for item ${plc.id} (barcode_unit_id: ${plc.barcode_unit_id}, product_id: ${plc.product_id})`);
        }

        // 🔥 FAST SYNC: Check if promotion already exists and just update fields
        const existingPromotion = await Promotion.findOne({
          productUnit: storeProductUnitId,
          type: 'fixed_price',
          isActive: true
        });

        if (existingPromotion) {
          console.log(`🚀 Fast update for existing promotion ${existingPromotion._id}`);
          
          // Simple field update without complex checks
          await Promotion.updateOne(
            { _id: existingPromotion._id },
            { 
              $set: { 
                value: plc.fixed_price,
                minQty: plc.min_quantity || 1,
                maxQty: plc.max_quantity || null,
                startDate: plc.date_start || existingPromotion.startDate,
                endDate: plc.date_end || existingPromotion.endDate,
                lastUpdated: new Date(),
                _last_odoo_sync: new Date()
              }
            }
          );
          
          // Link and mark as updated
          await OdooPricelistItem.updateOne(
            { id: plc.id },
            { 
              $set: { 
                store_promotion_id: existingPromotion._id,
                _sync_status: 'updated',
                _last_sync_date: new Date()
              }
            }
          );
          
          imported += 1;
          continue;
        }

        // Select promotion list (fixed_price)
        let promoListId = null;
        const fixedList = await (require('../models/PromotionList')).findOne({ type: 'fixed_price', isActive: true }).sort({ priority: 1 });
        if (fixedList) promoListId = fixedList._id;

        // Build promotion record
        const promoDoc = {
          name: { en: plc.product_name || 'Special Price' },
          description: { en: `Imported from Odoo pricelist ${plc.pricelist_name || plc.pricelist_id}` },
          type: 'fixed_price',
          productUnit: storeProductUnitId,
          value: plc.fixed_price,
          minQty: plc.min_quantity || 1,
          maxQty: plc.max_quantity || null,
          startDate: plc.date_start || new Date(),
          endDate: plc.date_end || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          isActive: true,
          promotionList: promoListId,
        };

        const promo = await Promotion.create(promoDoc);

        // Link both directions
        await Promotion.updateOne({ _id: promo._id }, { $set: { odoo_pricelist_item_id: plc.id } });
        await OdooPricelistItem.updateOne({ id: plc.id }, { $set: { store_promotion_id: promo._id, _sync_status: 'imported' } });

        console.log(`🆕 Successfully created NEW promotion ${promo._id} for item ${plc.id}`);
        imported += 1;
      } catch (err) {
        console.error(`❌ Failed importing pricelist item ${plc.id}:`, err.message);
        errors.push(`Item ${plc.id}: ${err.message}`);
        await OdooPricelistItem.updateOne({ id: plc.id }, { $set: { _sync_status: 'failed', _import_error: err.message } });
      }
    }

    console.log(`🎉 Promotion import completed: ${imported} imported/updated, ${errors.length} errors`);
    return { imported, errors };
  }

  /**
   * Validate and fix data consistency issues before import
   */
  async validateAndFixDataConsistency(items) {

    
    try {
      // 1. Clear invalid store_promotion_id references
      const invalidPromotionIds = [];
      for (const item of items) {
        if (item.store_promotion_id) {
          const promotion = await Promotion.findById(item.store_promotion_id);
          if (!promotion) {
            invalidPromotionIds.push(item.id);
          }
        }
      }
      
      if (invalidPromotionIds.length > 0) {
        console.log(`🧹 Clearing ${invalidPromotionIds.length} invalid promotion references...`);
        await OdooPricelistItem.updateMany(
          { id: { $in: invalidPromotionIds } },
          { 
            $unset: { store_promotion_id: 1 }, 
            $set: { _sync_status: 'pending', _import_error: null } 
          }
        );
      }

      // 🔥 NEW: Clean up duplicate promotions by product/unit combination
      console.log('🧹 Checking for duplicate promotions...');
      const allPromotions = await Promotion.find({ type: 'fixed_price', isActive: true });
      const duplicateGroups = new Map();
      
      for (const promotion of allPromotions) {
        const key = `${promotion.productUnit}_${promotion.type}`;
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key).push(promotion);
      }
      
      let duplicatesRemoved = 0;
      for (const [key, promotions] of duplicateGroups) {
        if (promotions.length > 1) {
          console.log(`⚠️ Found ${promotions.length} duplicate promotions for key: ${key}`);
          
          // Keep the most recent one, remove others
          const sortedPromotions = promotions.sort((a, b) => 
            new Date(b.createdAt || b._id.getTimestamp()) - new Date(a.createdAt || a._id.getTimestamp())
          );
          
          const keepPromotion = sortedPromotions[0];
          const removePromotions = sortedPromotions.slice(1);
          
          console.log(`🔄 Keeping promotion ${keepPromotion._id}, removing ${removePromotions.length} duplicates`);
          
          // Remove duplicate promotions
          for (const dupPromotion of removePromotions) {
            await Promotion.deleteOne({ _id: dupPromotion._id });
            duplicatesRemoved++;
          }
          
          // Update all odoo items to point to the kept promotion
          await OdooPricelistItem.updateMany(
            { store_promotion_id: { $in: removePromotions.map(p => p._id) } },
            { $set: { store_promotion_id: keepPromotion._id } }
          );
        }
      }
      
      if (duplicatesRemoved > 0) {
        console.log(`🧹 Cleaned up ${duplicatesRemoved} duplicate promotions`);
      }

      // 2. Ensure products are imported for all items (both product_id and product_tmpl_id)
      const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];
      const templateIds = [...new Set(items.map(item => item.product_tmpl_id).filter(Boolean))];
      const missingProducts = [];
      
      // Check products by product_id
      for (const productId of productIds) {
        const odooProduct = await OdooProduct.findOne({ id: productId });
        if (odooProduct && !odooProduct.store_product_id) {
          missingProducts.push(productId);
        }
      }
      
      // Check products by product_tmpl_id (for template-level promotions)
      for (const templateId of templateIds) {
        const odooProduct = await OdooProduct.findOne({ product_tmpl_id: templateId });
        if (odooProduct && !odooProduct.store_product_id) {
          missingProducts.push(odooProduct.id);
        }
      }
      
      // Remove duplicates
      const uniqueMissingProducts = [...new Set(missingProducts)];
      
      if (uniqueMissingProducts.length > 0) {
        console.log(`📦 Auto-importing ${uniqueMissingProducts.length} missing products...`);
        try {
          await this.importProducts(uniqueMissingProducts);
        } catch (err) {
          console.warn(`Auto-import of products failed:`, err.message);
        }
      }

      // 3. Ensure barcode units are mapped
      const barcodeUnitIds = [...new Set(items.map(item => item.barcode_unit_id).filter(Boolean))];
      const unmappedBarcodeUnits = [];
      
      for (const barcodeUnitId of barcodeUnitIds) {
        const barcodeUnit = await OdooBarcodeUnit.findOne({ id: barcodeUnitId });
        if (barcodeUnit && !barcodeUnit.store_product_unit_id) {
          unmappedBarcodeUnits.push(barcodeUnit);
        }
      }
      
      if (unmappedBarcodeUnits.length > 0) {
        console.log(`🔗 Mapping ${unmappedBarcodeUnits.length} unmapped barcode units...`);
        for (const barcodeUnit of unmappedBarcodeUnits) {
          try {
            const odooProduct = await OdooProduct.findOne({ id: barcodeUnit.product_id });
            if (odooProduct && odooProduct.store_product_id) {
              await this.importProductUnits(odooProduct, { _id: odooProduct.store_product_id });
            }
          } catch (err) {
            console.warn(`Failed to map barcode unit ${barcodeUnit.id}:`, err.message);
          }
        }
      }

      console.log('✅ Data consistency validation completed');
    } catch (error) {
      console.error('❌ Data consistency validation failed:', error);
    }
  }

  /**
   * Reconcile all existing products' categories using Odoo mappings.
   * Safe: only updates products with missing/null or placeholder/unknown categories.
   */
  async reconcileAllProductCategories() {
    try {
      console.log('🔄 Full reconciliation: products category assignments by Odoo mapping...');

      // Build mapping of odoo category -> store category
      const mappedCats = await OdooCategory.find({ store_category_id: { $ne: null } }, { id: 1, store_category_id: 1 }).lean();
      if (!mappedCats || mappedCats.length === 0) {
        console.log('ℹ️ No Odoo category mappings found');
        return { updated: 0 };
      }
      const odooIdToStoreCat = new Map(mappedCats.map(c => [Number(c.id), String(c.store_category_id)]));

      // Identify unknown categories in store
      const unknownCats = await Category.find({
        $or: [
          { slug: /unknown/i },
          { 'name.en': /unknown/i },
          { 'name.ar': /غير معروف/i },
          { 'name.en': /uncategor/i },
          { 'name.ar': /غير مصنف/i },
        ]
      }, { _id: 1 }).lean();
      const unknownCatIds = new Set(unknownCats.map(c => String(c._id)));

      // Collect store product ids grouped by target store category based on OdooProduct mapping
      const odooProducts = await OdooProduct.find({ store_product_id: { $ne: null }, categ_id: { $ne: null } }, { categ_id: 1, store_product_id: 1 }).lean();
      const storeCatToProductIds = new Map();
      for (const op of odooProducts) {
        const storeCatId = odooIdToStoreCat.get(Number(op.categ_id));
        if (!storeCatId) continue;
        if (!storeCatToProductIds.has(storeCatId)) storeCatToProductIds.set(storeCatId, []);
        storeCatToProductIds.get(storeCatId).push(op.store_product_id);
      }

      let updatedCount = 0;
      for (const [storeCatId, productIds] of storeCatToProductIds.entries()) {
        if (!productIds || productIds.length === 0) continue;

        const query = {
          _id: { $in: productIds },
          $or: [
            { category: { $exists: false } },
            { category: null },
            { category: { $in: Array.from(unknownCatIds) } },
          ],
        };

        const res = await Product.updateMany(query, { $set: { category: storeCatId, categories: [storeCatId] } });
        updatedCount += res.modifiedCount || 0;
      }

      // Fallback: scan Uncategorized products and match by barcode/SKU against OdooProduct (all mappings)
      try {
        const unknownCatsArr = Array.from(unknownCatIds);
        const unknownProducts = await Product.find({ category: { $in: unknownCatsArr } }, { _id: 1, barcode: 1, sku: 1 }).lean();
        if (unknownProducts && unknownProducts.length > 0) {
          const barcodeToIds = new Map();
          const skuToIds = new Map();
          for (const p of unknownProducts) {
            if (p.barcode) {
              const key = String(p.barcode).trim();
              if (!barcodeToIds.has(key)) barcodeToIds.set(key, []);
              barcodeToIds.get(key).push(p._id);
            }
            if (p.sku) {
              const key = String(p.sku).trim();
              if (!skuToIds.has(key)) skuToIds.set(key, []);
              skuToIds.get(key).push(p._id);
            }
          }

          const odooMatches = await OdooProduct.find({
            $or: [
              { barcode: { $in: Array.from(barcodeToIds.keys()) } },
              { default_code: { $in: Array.from(skuToIds.keys()) } },
            ],
          }, { categ_id: 1, barcode: 1, default_code: 1 }).lean();

          const storeCatToUnknownProducts = new Map();
          for (const op of odooMatches) {
            const storeCatId = odooIdToStoreCat.get(Number(op.categ_id));
            if (!storeCatId) continue;
            let ids = [];
            if (op.barcode && barcodeToIds.has(String(op.barcode).trim())) {
              ids.push(...barcodeToIds.get(String(op.barcode).trim()));
            }
            if (op.default_code && skuToIds.has(String(op.default_code).trim())) {
              ids.push(...skuToIds.get(String(op.default_code).trim()));
            }
            if (ids.length === 0) continue;
            if (!storeCatToUnknownProducts.has(storeCatId)) storeCatToUnknownProducts.set(storeCatId, new Set());
            const setRef = storeCatToUnknownProducts.get(storeCatId);
            ids.forEach(id => setRef.add(id));
          }

          let fbUpdated = 0;
          for (const [storeCatId, idSet] of storeCatToUnknownProducts.entries()) {
            const ids = Array.from(idSet);
            if (ids.length === 0) continue;
            const res2 = await Product.updateMany({ _id: { $in: ids } }, { $set: { category: storeCatId, categories: [storeCatId] } });
            fbUpdated += res2.modifiedCount || 0;
          }
          updatedCount += fbUpdated;
          console.log(`✅ Full reconciliation fallback updated ${fbUpdated} products`);
        }
      } catch (fbErr) {
        console.warn('⚠️ Full reconciliation fallback failed:', fbErr.message);
      }

      console.log(`✅ Full reconciliation updated ${updatedCount} products`);
      return { updated: updatedCount };
    } catch (err) {
      console.warn('⚠️ Full reconciliation failed:', err.message);
      return { updated: 0, error: err.message };
    }
  }

  /**
   * Get or create a basic unit for products without units
   */
  async getOrCreateBasicUnit() {
    try {
      // Try to find existing basic unit
      let basicUnit = await require('../models/Unit').findOne({
        $or: [
          { name: { en: 'Unit' } },
          { name: { en: 'Piece' } },
          { name: { en: 'Item' } },
          { shortName: 'unit' },
          { shortName: 'pc' },
          { shortName: 'item' }
        ]
      });

      if (basicUnit) {
        return basicUnit._id;
      }

      // Create a basic unit if none exists
      basicUnit = await require('../models/Unit').create({
        name: { en: 'Unit', ar: 'وحدة' },
        shortName: 'unit',
        isActive: true
      });

      console.log(`✅ Created basic unit: ${basicUnit._id}`);
      return basicUnit._id;
    } catch (error) {
      console.error('❌ Error creating basic unit:', error.message);
      throw new Error(`Failed to create basic unit: ${error.message}`);
    }
  }
}

module.exports = new OdooImportService(); 