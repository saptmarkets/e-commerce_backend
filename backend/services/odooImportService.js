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
    this.batchSize = 50;
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
      for (const cat of odooCats) {
        try {
          if (cat.store_category_id) continue; // already mapped

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

          // Save mapping for leaf category
          await OdooCategory.updateOne(
            { _id: cat._id },
            { store_category_id: parentId, _sync_status: 'imported' }
          );
        } catch (catErr) {
          console.error(`Category import error (ID ${cat.id}):`, catErr.message);
          errors.push(`Category ${cat.name || cat.id}: ${catErr.message}`);
        }
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
      const odooProducts = await OdooProduct.find({ product_id: { $in: productIds.map(Number) } });
      console.log(`Found ${odooProducts.length} products to import`);

      for (const p of odooProducts) {
        try {
          // Check if product already exists
          const existing = await Product.findOne({
            $or: [
              { sku: p.default_code },
              { barcode: p.barcode }
            ].filter(condition => Object.values(condition)[0]) // Filter out null/undefined values
          });

          if (existing) {
            // Update existing product mapping
            p.store_product_id = existing._id;
            p._sync_status = 'imported';
            await p.save();
            console.log(`Product already exists: ${p.name}`);
            continue;
          }

          // Resolve category reference or create default category
          let storeCategoryId = null;
          if (p.category_id) {
            const catMap = await OdooCategory.findOne({ id: p.category_id });
            if (catMap && catMap.store_category_id) {
              storeCategoryId = catMap.store_category_id;
            }
          }

          if (!storeCategoryId && p.category_id) {
            // Attempt on-demand category import
            try {
              const catResult = await this.importCategories([p.category_id]);
              if (catResult && catResult.imported >= 0) {
                const catMapAfter = await OdooCategory.findOne({ id: p.category_id });
                if (catMapAfter && catMapAfter.store_category_id) {
                  storeCategoryId = catMapAfter.store_category_id;
                }
              }
            } catch (catImpErr) {
              console.warn(`Category auto-import failed for ID ${p.category_id}:`, catImpErr.message);
            }
          }

          // If no category found, create or find a default category
          if (!storeCategoryId) {
            let defaultCategory = await Category.findOne({ 'name.en': 'Imported Products' });
            if (!defaultCategory) {
              defaultCategory = await Category.create({
                name: { en: 'Imported Products', ar: 'المنتجات المستوردة' },
                slug: 'imported-products',
                status: 'show',
                icon: '',
                type: 'parent'
              });
              console.log('Created default category: Imported Products');
            }
            storeCategoryId = defaultCategory._id;
          }

          // Create basic unit if needed
          let basicUnit = await Unit.findOne({ shortCode: 'pcs' });
          if (!basicUnit) {
            basicUnit = await Unit.create({
              name: 'Pieces',
              shortCode: 'pcs',
              type: 'piece',
              isBase: true
            });
          }

          // Split bilingual name into EN/AR fields
          const titleObj = this.splitBilingualName(p.name);

          // -----------------------------------------------------------------
          // STOCK BY LOCATION AGGREGATION
          // -----------------------------------------------------------------
          let locationStocks = [];
          try {
            const stockRecords = await OdooStock.find({ product_id: p.product_id, is_active: true });
            locationStocks = stockRecords.map(sr => ({
              locationId: sr.location_id,
              name: sr.location_name,
              qty: sr.available_quantity ?? sr.quantity ?? 0,
            }));

            // If branch filter is configured, keep only relevant locations
            if (BRANCH_LOCATION_IDS.length > 0) {
              locationStocks = locationStocks.filter(ls => BRANCH_LOCATION_IDS.includes(ls.locationId));
            }
          } catch (lsErr) {
            console.warn('Failed to aggregate location stock for product', p.product_id, lsErr.message);
          }

          const totalQty = locationStocks.reduce((acc, ls) => acc + (ls.qty || 0), 0);

          const slugSource = titleObj.en || Object.values(titleObj)[0] || p.name;
          const slug = this.createSlug(slugSource);

          // Create product in store
          const newProd = await Product.create({
            sku: p.default_code || `ODOO-${p.product_id}`,
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
            availableUnits: [basicUnit._id]
          });

          // -----------------------------------------------------------------
          // Ensure a ProductUnit entry exists for the basic unit (packQty = 1)
          // -----------------------------------------------------------------
          try {
            let basePU = await ProductUnit.findOne({
              product: newProd._id,
              unit: basicUnit._id,
              packQty: 1,
            });

            if (!basePU) {
              basePU = await ProductUnit.create({
                product: newProd._id,
                unit: basicUnit._id,
                unitType: 'base',
                unitValue: 1,
                packQty: 1,
                price: newProd.price,
                sku: newProd.sku,
                barcode: newProd.barcode,
                isDefault: true,
                isActive: true,
                isAvailable: true,
                stock: totalQty,
                locationStocks,
              });
            }

            // Keep ID at the front of the availableUnits array for easier sorting
            await Product.findByIdAndUpdate(newProd._id, {
              availableUnits: [basicUnit._id],
            });
          } catch (puErr) {
            console.error('⚠️  Failed creating basic ProductUnit:', puErr.message);
          }

          // Mark imported in Odoo collection
          p.store_product_id = newProd._id;
          p._sync_status = 'imported';
          await p.save();

          imported++;
          console.log(`Imported product: ${p.name}`);

          // ---- MULTI-UNITS ----
          try {
            // Trisha: Let's make sure we import ALL units, not just the first one!
            const unitResult = await this.importProductUnits(p, newProd, { stock: totalQty, locationStocks });
            units += unitResult.units;
            if (unitResult.units > 0) {
              // Update product to indicate it has multi-units
              await Product.findByIdAndUpdate(newProd._id, {
                hasMultiUnits: true,
                availableUnits: unitResult.unitIds
              });
            }
            // Trisha: Log the number of units imported for this product!
            console.log(`[Trisha] Imported ${unitResult.units} units for product ${p.name} (ID: ${newProd._id})`);
          } catch (unitError) {
            console.error(`Error importing units for product ${p.name}:`, unitError);
            errors.push(`Product "${p.name}" units: ${unitError.message}`);
          }

        } catch (error) {
          console.error(`Error importing product ${p.name}:`, error);
          errors.push(`Product "${p.name}": ${error.message}`);
        }
      }

      return { imported, units, errors };

    } catch (error) {
      console.error('Products import batch error:', error);
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
      // Only import the units that the product currently references.
      // This avoids importing stale / orphaned barcode units that still
      // share the same product_id but are no longer linked to the
      // product (which caused duplicate units in the admin).

      let unitFilter = { active: true };
      if (odooProduct.barcode_unit_ids && odooProduct.barcode_unit_ids.length > 0) {
        unitFilter.id = { $in: odooProduct.barcode_unit_ids };
      } else {
        unitFilter.product_id = odooProduct.product_id;
      }

      const odooUnits = await OdooBarcodeUnit.find(unitFilter);

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
            storeUnit = await Unit.create({ 
              name: unitName, 
              shortCode, 
              type: 'pack', 
              isBase: false 
            });
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
            
            console.log(`Creating ProductUnit for barcode ${bu.barcode} with data:`, {
              product: productUnitData.product,
              unit: productUnitData.unit,
              name: productUnitData.name,
              barcode: productUnitData.barcode
            });
            
            prodUnit = await ProductUnit.create(productUnitData);
            
            if (!prodUnit || !prodUnit._id) {
              throw new Error(`Failed to create ProductUnit for barcode unit ${bu.id}`);
            }
            
            console.log(`✅ Created ProductUnit ${prodUnit._id} for barcode unit ${bu.id}`);
            units++;
          } else {
            // Ensure stock fields stay in sync for existing units
            await prodUnit.set({
              stock: stock || 0,
              locationStocks: locationStocks || [],
              isActive: true,
              isAvailable: true
            }).save();
            
            console.log(`✅ Updated existing ProductUnit ${prodUnit._id} for barcode unit ${bu.id}`);
          }

          // Update Odoo barcode unit mapping
          bu.store_product_unit_id = prodUnit._id;
          bu._sync_status = 'imported';
          await bu.save();
          
          console.log(`✅ Mapped barcode unit ${bu.id} (${bu.name}) to ProductUnit ${prodUnit._id}`);

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

      // --- Deactivate obsolete ProductUnits that are no longer referenced ---
      try {
        const activeBarcodes = odooUnits.map(u => u.barcode).filter(Boolean);

        await ProductUnit.updateMany(
          {
            product: storeProduct._id,
            unitType: 'multi',
            barcode: { $nin: activeBarcodes },
            isActive: true,
          },
          { isActive: false, isAvailable: false }
        );

        // Refresh availableUnits array to include only still-active units
        const validUnits = await ProductUnit.find({
          product: storeProduct._id,
          isActive: true,
        }, '_id');
        
        // Update the store product with the correct availableUnits
        const updatedProduct = await Product.findByIdAndUpdate(
          storeProduct._id, 
          {
            availableUnits: validUnits.map(u => u._id),
            hasMultiUnits: validUnits.length > 1
          },
          { new: true }
        );
        
        console.log(`✅ Updated product ${storeProduct._id} with ${validUnits.length} available units`);
        
        // Ensure the store product object reflects the changes for subsequent operations
        if (storeProduct.availableUnits) {
          storeProduct.availableUnits = validUnits.map(u => u._id);
        }
        
      } catch (cleanupErr) {
        console.warn('⚠️  Unit cleanup failed:', cleanupErr.message);
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

    // Pre-validate and fix data consistency issues
    console.log('🔧 Pre-validating data consistency...');
    await this.validateAndFixDataConsistency(items);

    for (const plc of items) {
      try {
        // Skip inactive / expired
        if (plc.date_end && plc.date_end < new Date()) {
          continue;
        }

        // Check if already imported
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
            console.log(`✅ Item ${plc.id} already has valid promotion, skipping`);
            continue;
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
              
              const odooProduct = await OdooProduct.findOne({ product_id: bu.product_id });
              if (odooProduct) {
                // Ensure the product exists in store collections first
                if (!odooProduct.store_product_id) {
                  console.log(`Product ${odooProduct.product_id} not in store, importing...`);
                  try {
                    await this.importProducts([odooProduct.product_id]);
                    await odooProduct.reload();
                  } catch (impErr) {
                    console.warn(`Auto-import product ${odooProduct.product_id} failed:`, impErr.message);
                    throw new Error(`Failed to import product ${odooProduct.product_id}: ${impErr.message}`);
                  }
                }

                // Now import/update all units for this product to ensure the barcode unit gets mapped
                try {
                  console.log(`Importing units for product ${odooProduct.product_id} to ensure barcode unit mapping...`);
                  await this.importProductUnits(odooProduct, { _id: odooProduct.store_product_id });
                  
                  // Reload the barcode unit to get the newly set store_product_unit_id
                  await bu.reload();
                  console.log(`After unit import, barcode unit ${bu.id} store mapping:`, bu.store_product_unit_id);
                } catch (unitImportErr) {
                  console.error(`Auto-import units for product ${odooProduct.product_id} failed:`, unitImportErr.message);
                  throw new Error(`Failed to import units for product ${odooProduct.product_id}: ${unitImportErr.message}`);
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

        // 2) Fallback: lookup by product variant (product_id) - for promotions without specific barcode units
        if (!storeProductUnitId && plc.product_id) {
          console.log(`Falling back to product_id lookup for item ${plc.id}`);
          const opById = await OdooProduct.findOne({ product_id: plc.product_id });
          if (opById) {
            // Ensure product exists in store collections
            if (!opById.store_product_id) {
              try {
                await this.importProducts([opById.product_id]);
                await opById.reload();
              } catch (impErr) {
                console.warn('Auto-import product failed', impErr.message);
              }
            }

            if (opById.store_product_id) {
              const defaultPU = await ProductUnit.findOne({ product: opById.store_product_id, isDefault: true });
              if (defaultPU) storeProductUnitId = defaultPU._id;
            }
          }
        }

        // 3) Fallback: lookup by template (product_tmpl_id) - last resort
        if (!storeProductUnitId && plc.product_tmpl_id) {
          console.log(`Falling back to product_tmpl_id lookup for item ${plc.id}`);
          const opByTpl = await OdooProduct.findOne({ product_tmpl_id: plc.product_tmpl_id });
          if (opByTpl) {
            if (!opByTpl.store_product_id) {
              try {
                await this.importProducts([opByTpl.product_id]); // Use product_id for import
                await opByTpl.reload();
              } catch (impErr) {
                console.warn('Auto-import product failed', impErr.message);
              }
            }
            if (opByTpl.store_product_id) {
              const defaultPU = await ProductUnit.findOne({ product: opByTpl.store_product_id, isDefault: true });
              if (defaultPU) storeProductUnitId = defaultPU._id;
            }
          }
        }

        if (!storeProductUnitId) {
          throw new Error(`No mapped ProductUnit for item ${plc.id} (barcode_unit_id: ${plc.barcode_unit_id}, product_id: ${plc.product_id})`);
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

        // Update mapping
        await OdooPricelistItem.updateOne({ id: plc.id }, { $set: { store_promotion_id: promo._id, _sync_status: 'imported' } });

        console.log(`✅ Successfully imported promotion ${promo._id} for item ${plc.id}`);
        imported += 1;
      } catch (err) {
        console.error(`❌ Failed importing pricelist item ${plc.id}:`, err.message);
        errors.push(`Item ${plc.id}: ${err.message}`);
        await OdooPricelistItem.updateOne({ id: plc.id }, { $set: { _sync_status: 'failed', _import_error: err.message } });
      }
    }

    console.log(`🎉 Promotion import completed: ${imported} imported, ${errors.length} errors`);
    return { imported, errors };
  }

  /**
   * Validate and fix data consistency issues before import
   */
  async validateAndFixDataConsistency(items) {
    console.log('🔍 Validating data consistency...');
    
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

      // 2. Ensure products are imported for all items
      const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];
      const missingProducts = [];
      
      for (const productId of productIds) {
        const odooProduct = await OdooProduct.findOne({ product_id: productId });
        if (odooProduct && !odooProduct.store_product_id) {
          missingProducts.push(productId);
        }
      }
      
      if (missingProducts.length > 0) {
        console.log(`📦 Auto-importing ${missingProducts.length} missing products...`);
        try {
          await this.importProducts(missingProducts);
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
            const odooProduct = await OdooProduct.findOne({ product_id: barcodeUnit.product_id });
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
}

module.exports = new OdooImportService(); 