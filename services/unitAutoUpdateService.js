const ProductUnit = require('../models/ProductUnit');
const Unit = require('../models/Unit');
const OdooBarcodeUnit = require('../models/OdooBarcodeUnit');

class UnitAutoUpdateService {
  constructor() {
    this.unitCache = new Map(); // Cache Unit docs by name/shortCode
  }

  /**
   * Auto-update unit prices for products from Odoo barcode units
   * @param {Array<number>} odooProductIds - Array of Odoo product IDs
   * @returns {Object} Results summary
   */
  async autoUpdateUnits(odooProductIds) {
    try {
      console.log(`🏷️ Starting unit auto-update for ${odooProductIds.length} Odoo products...`);

      // 1. Get store products that match these Odoo IDs
      const Product = require('../models/Product');
      const storeProducts = await Product.find({ 
        odooProductId: { $in: odooProductIds } 
      }).select('_id odooProductId basicUnit hasMultiUnits');

      if (storeProducts.length === 0) {
        console.log('ℹ️ No store products found for the given Odoo IDs');
        return {
          success: true,
          summary: {
            total: odooProductIds.length,
            storeProductsFound: 0,
            unitsUpdated: 0,
            unitsInserted: 0,
            unitsSkipped: 0,
            errors: 0
          },
          details: []
        };
      }

      console.log(`🔍 Found ${storeProducts.length} store products to update units for`);

      // 2. Get existing ProductUnits for these products
      const productIds = storeProducts.map(p => p._id);
      const existingProductUnits = await ProductUnit.find({ 
        product: { $in: productIds } 
      }).populate('unit', 'name shortCode');

      // 3. Get Odoo barcode units for these products
      // Be permissive about activity flag (some writers use is_active)
      const odooBarcodeUnits = await OdooBarcodeUnit.find({ 
        product_id: { $in: odooProductIds },
        $or: [ { active: true }, { is_active: true } ]
      });

      console.log(`🏷️ Found ${odooBarcodeUnits.length} Odoo barcode units to process`);

      // 4. Group data for efficient processing
      const storeProductMap = new Map();
      storeProducts.forEach(p => storeProductMap.set(p.odooProductId, p));

      const productUnitMap = new Map();
      existingProductUnits.forEach(pu => {
        if (!productUnitMap.has(pu.product.toString())) {
          productUnitMap.set(pu.product.toString(), []);
        }
        productUnitMap.get(pu.product.toString()).push(pu);
      });

      const odooUnitMap = new Map();
      odooBarcodeUnits.forEach(unit => {
        if (!odooUnitMap.has(unit.product_id)) {
          odooUnitMap.set(unit.product_id, []);
        }
        odooUnitMap.get(unit.product_id).push(unit);
      });

      // 5. Process each product's units
      const results = [];
      let totalUnitsUpdated = 0;
      let totalUnitsInserted = 0;
      let totalUnitsSkipped = 0;
      let totalErrors = 0;

      for (const storeProduct of storeProducts) {
        const odooUnits = odooUnitMap.get(storeProduct.odooProductId) || [];
        const existingUnits = productUnitMap.get(storeProduct._id.toString()) || [];

        console.log(`🔄 Processing units for product ${storeProduct.odooProductId} (${odooUnits.length} Odoo units, ${existingUnits.length} existing units)`);

        const productResults = await this.processProductUnits(
          storeProduct,
          odooUnits,
          existingUnits
        );

        results.push({
          odooProductId: storeProduct.odooProductId,
          storeProductId: storeProduct._id,
          ...productResults
        });

        totalUnitsUpdated += productResults.unitsUpdated;
        totalUnitsInserted += productResults.unitsInserted;
        totalUnitsSkipped += productResults.unitsSkipped;
        totalErrors += productResults.errors;
      }

      // 6. Update Product model helpers (hasMultiUnits, availableUnits, etc.)
      await this.updateProductHelpers(storeProducts);

      console.log(`✅ Unit auto-update completed: ${totalUnitsUpdated} updated, ${totalUnitsInserted} inserted, ${totalUnitsSkipped} skipped, ${totalErrors} errors`);

      return {
        success: true,
        summary: {
          total: odooProductIds.length,
          storeProductsFound: storeProducts.length,
          unitsUpdated: totalUnitsUpdated,
          unitsInserted: totalUnitsInserted,
          unitsSkipped: totalUnitsSkipped,
          errors: totalErrors
        },
        details: results
      };

    } catch (error) {
      console.error('❌ Error in unit auto-update:', error);
      throw error;
    }
  }

  /**
   * Process units for a single product
   */
  async processProductUnits(storeProduct, odooUnits, existingUnits) {
    const operations = [];
    const results = {
      unitsUpdated: 0,
      unitsInserted: 0,
      unitsSkipped: 0,
      errors: 0,
      details: []
    };

    for (const odooUnit of odooUnits) {
      try {
        // Find matching existing ProductUnit
        let existingUnit = this.findMatchingProductUnit(odooUnit, existingUnits);
        
        if (existingUnit) {
          // Update existing unit
          const updateOp = this.createUpdateOperation(existingUnit._id, odooUnit);
          if (updateOp) {
            operations.push(updateOp);
            results.unitsUpdated++;
            results.details.push({
              action: 'updated',
              unitId: existingUnit._id,
              barcode: odooUnit.barcode,
              oldPrice: existingUnit.price,
              newPrice: odooUnit.price
            });
          }
        } else {
          // Create new unit
          const insertOp = await this.createInsertOperation(storeProduct, odooUnit);
          if (insertOp) {
            operations.push(insertOp);
            results.unitsInserted++;
            results.details.push({
              action: 'inserted',
              barcode: odooUnit.barcode,
              price: odooUnit.price,
              packQty: odooUnit.quantity
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing Odoo unit ${odooUnit.id}:`, error.message);
        results.errors++;
        results.details.push({
          action: 'error',
          odooUnitId: odooUnit.id,
          error: error.message
        });
      }
    }

    // Execute bulk operations
    if (operations.length > 0) {
      try {
        await ProductUnit.bulkWrite(operations, { ordered: false });
        console.log(`✅ Bulk operations completed for product ${storeProduct.odooProductId}: ${operations.length} operations`);
      } catch (bulkError) {
        console.error(`❌ Bulk operations failed for product ${storeProduct.odooProductId}:`, bulkError.message);
        results.errors += operations.length;
      }
    }

    return results;
  }

  /**
   * Find matching ProductUnit for an Odoo barcode unit
   */
  findMatchingProductUnit(odooUnit, existingUnits) {
    // First try to match by barcode (most reliable)
    if (odooUnit.barcode) {
      const matchByBarcode = existingUnits.find(pu => pu.barcode === odooUnit.barcode);
      if (matchByBarcode) {
        return matchByBarcode;
      }
    }

    // Fallback: match by unit name/shortCode (case-insensitive) and packQty
    const unitNameRaw = odooUnit.unit || 'unknown';
    const unitName = String(unitNameRaw).trim().toLowerCase();
    const packQty = Number(odooUnit.quantity || 1);

    return existingUnits.find(pu => {
      const existingName = (pu.unit && pu.unit.name) ? String(pu.unit.name).trim().toLowerCase() : '';
      const existingShort = (pu.unit && pu.unit.shortCode) ? String(pu.unit.shortCode).trim().toLowerCase() : '';
      const matchName = existingName && (existingName === unitName);
      const matchShort = existingShort && (existingShort === unitName);
      return (matchName || matchShort) && pu.packQty === packQty;
    });
  }

  /**
   * Create update operation for existing ProductUnit
   */
  createUpdateOperation(productUnitId, odooUnit) {
    const updateData = {};

    // Update price if different
    if (odooUnit.price !== undefined) {
      updateData.price = Number(odooUnit.price);
    }

    // Update cost price if available
    if (odooUnit.av_cost !== undefined) {
      updateData.costPrice = Number(odooUnit.av_cost);
    } else if (odooUnit.purchase_cost !== undefined) {
      updateData.costPrice = Number(odooUnit.purchase_cost);
    }

    // Update barcode if provided and different
    if (odooUnit.barcode && odooUnit.barcode !== '') {
      updateData.barcode = odooUnit.barcode;
    }

    // Update packQty if different
    if (odooUnit.quantity !== undefined) {
      updateData.packQty = Number(odooUnit.quantity);
    }

    // Update SKU if not present
    if (!odooUnit.barcode) {
      updateData.sku = `ODOO-${odooUnit.id}`;
    }

    if (Object.keys(updateData).length === 0) {
      return null; // No updates needed
    }

    updateData.updatedAt = new Date();

    return {
      updateOne: {
        filter: { _id: productUnitId },
        update: { $set: updateData }
      }
    };
  }

  /**
   * Create insert operation for new ProductUnit
   */
  async createInsertOperation(storeProduct, odooUnit) {
    try {
      // Resolve or create Unit
      const unit = await this.resolveUnit(odooUnit.unit);
      if (!unit) {
        console.warn(`⚠️ Could not resolve unit for Odoo unit ${odooUnit.id}`);
        return null;
      }

      const insertData = {
        product: storeProduct._id,
        unit: unit._id,
        unitType: odooUnit.quantity === 1 ? 'basic' : 'multi',
        unitValue: 1,
        packQty: Number(odooUnit.quantity || 1),
        price: Number(odooUnit.price || 0),
        costPrice: Number(odooUnit.av_cost || odooUnit.purchase_cost || 0),
        barcode: odooUnit.barcode || null,
        sku: odooUnit.barcode ? `ODOO-${odooUnit.id}` : null,
        isDefault: odooUnit.quantity === 1, // Basic unit is default
        isActive: true,
        isAvailable: true,
        minOrderQuantity: 1,
        stock: 0, // Will be updated by stock sync
        locationStocks: [],
        title: odooUnit.name || 'N/A',
        dimensions: { length: 0, width: 0, height: 0 },
        attributes: { color: '', size: '', flavor: '', material: '' },
        weight: 0,
        tags: [],
        images: [],
        sortOrder: odooUnit.sequence || 10,
        views: 0,
        sales: 0,
        pendingOdooQty: 0,
        bulkPricing: []
      };

      return {
        insertOne: {
          document: insertData
        }
      };

    } catch (error) {
      console.error(`❌ Error creating insert operation for Odoo unit ${odooUnit.id}:`, error.message);
      return null;
    }
  }

  /**
   * Resolve or create Unit by name/shortCode
   */
  async resolveUnit(unitName) {
    if (!unitName) {
      return null;
    }

    // Check cache first
    if (this.unitCache.has(unitName)) {
      return this.unitCache.get(unitName);
    }

    try {
      // Try to find existing unit
      let unit = await Unit.findOne({
        $or: [
          { name: unitName },
          { shortCode: unitName },
          { name: { $regex: new RegExp(`^${unitName}$`, 'i') } }
        ]
      });

      if (!unit) {
        // Create new unit
        unit = await Unit.create({
          name: unitName,
          shortCode: unitName.toLowerCase().substring(0, 3),
          description: `Auto-created from Odoo: ${unitName}`,
          isActive: true
        });
        console.log(`✅ Created new Unit: ${unitName}`);
      }

      // Cache the unit
      this.unitCache.set(unitName, unit);
      return unit;

    } catch (error) {
      console.error(`❌ Error resolving unit ${unitName}:`, error.message);
      return null;
    }
  }

  /**
   * Update Product model helpers after unit changes
   */
  async updateProductHelpers(storeProducts) {
    console.log(`🔄 Updating Product model helpers for ${storeProducts.length} products...`);

    for (const storeProduct of storeProducts) {
      try {
        // Get all active ProductUnits for this product
        const productUnits = await ProductUnit.find({
          product: storeProduct._id,
          isActive: true
        }).populate('unit', 'name shortCode');

        // Update hasMultiUnits flag
        const hasMultiUnits = productUnits.length > 1;

        // Update availableUnits array
        const availableUnits = [...new Set(productUnits.map(pu => pu.unit._id))];

        // Update multiUnits embedded array (if still used)
        const multiUnits = productUnits.map(pu => ({
          unit: pu.unit._id,
          unitType: pu.unitType,
          packQty: pu.packQty,
          price: pu.price,
          sku: pu.sku,
          barcode: pu.barcode,
          isDefault: pu.isDefault,
          isActive: pu.isActive,
          minOrderQuantity: pu.minOrderQuantity,
          maxOrderQuantity: pu.maxOrderQuantity
        }));

        // Find default unit price for Product.price
        const defaultUnit = productUnits.find(pu => pu.isDefault) || productUnits[0];
        const defaultPrice = defaultUnit ? defaultUnit.price : 0;

        // Update Product
        const Product = require('../models/Product');
        await Product.updateOne(
          { _id: storeProduct._id },
          {
            $set: {
              hasMultiUnits,
              availableUnits,
              multiUnits,
              price: defaultPrice,
              updatedAt: new Date()
            }
          }
        );

        console.log(`✅ Updated Product ${storeProduct._id}: hasMultiUnits=${hasMultiUnits}, units=${availableUnits.length}, price=${defaultPrice}`);

      } catch (error) {
        console.error(`❌ Error updating Product helpers for ${storeProduct._id}:`, error.message);
      }
    }
  }
}

module.exports = new UnitAutoUpdateService(); 