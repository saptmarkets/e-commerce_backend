const models = require('../models');
const odooService = require('./odoo-enhanced');

class BarcodeUnitsService {
    constructor() {
        this.collections = null;
    }

    async initialize() {
        if (!this.collections) {
            this.collections = models.getCollections();
        }
    }

    // Find barcode unit by barcode
    async findByBarcode(barcode) {
        await this.initialize();
        return await this.collections.barcode_units.findOne({ 
            barcode: barcode,
            active: { $ne: false }
        });
    }

    // Find barcode units by product
    async findByProduct(productId) {
        await this.initialize();
        return await this.collections.barcode_units.find({ 
            product_id: parseInt(productId),
            active: { $ne: false }
        }).sort({ sequence: 1 }).toArray();
    }

    // Get price for a specific barcode unit from pricelist
    async getPriceForUnit(pricelistId, barcodeUnitId, quantity) {
        await this.initialize();
        
        // Get price rule from pricelist for specific barcode unit
        const priceRule = await this.collections.pricelist_items.findOne({
            pricelist_id: parseInt(pricelistId),
            barcode_unit_id: parseInt(barcodeUnitId),
            min_quantity: { $lte: quantity },
            $or: [
                { max_quantity: null },
                { max_quantity: { $gte: quantity } }
            ],
            $or: [
                { date_start: null },
                { date_start: { $lte: new Date() } }
            ],
            $or: [
                { date_end: null },
                { date_end: { $gte: new Date() } }
            ]
        }, { sort: { min_quantity: -1 } });

        if (priceRule && priceRule.fixed_price) {
            return priceRule.fixed_price;
        }

        // Fallback to unit's base price
        const unit = await this.collections.barcode_units.findOne({
            unit_id: parseInt(barcodeUnitId)
        });

        return unit && unit.price ? unit.price : 0;
    }

    // Create barcode unit in Odoo and sync back
    async createInOdoo(unitData) {
        try {
            const odooUnitId = await odooService.createBarcodeUnit(unitData);
            
            // The createBarcodeUnit method in odooService already syncs the created unit
            return odooUnitId;
        } catch (error) {
            console.error('Error creating barcode unit:', error);
            throw error;
        }
    }

    // Update barcode unit in Odoo
    async updateInOdoo(unitId, updateData) {
        try {
            await odooService.callOdoo('product.barcode.unit', 'write', [[unitId], updateData]);
            
            // Sync the updated unit back
            await odooService.syncSingleBarcodeUnit(unitId);
            
            return true;
        } catch (error) {
            console.error('Error updating barcode unit:', error);
            throw error;
        }
    }

    // Delete barcode unit in Odoo
    async deleteInOdoo(unitId) {
        try {
            await odooService.callOdoo('product.barcode.unit', 'unlink', [[unitId]]);
            
            // Remove from local database
            await this.collections.barcode_units.deleteOne({ unit_id: unitId });
            
            return true;
        } catch (error) {
            console.error('Error deleting barcode unit:', error);
            throw error;
        }
    }

    // Get all barcode units with product information
    async getAllWithProducts(limit = 100, offset = 0) {
        await this.initialize();
        
        const barcodeUnits = await this.collections.barcode_units.find({
            active: { $ne: false }
        })
        .sort({ sequence: 1, unit_id: 1 })
        .limit(limit)
        .skip(offset)
        .toArray();

        // Get product information for each unit
        const productIds = [...new Set(barcodeUnits.map(unit => unit.product_id))];
        const products = await this.collections.products.find({
            product_id: { $in: productIds }
        }).toArray();

        const productMap = {};
        products.forEach(product => {
            productMap[product.product_id] = product;
        });

        return barcodeUnits.map(unit => ({
            ...unit,
            product_name: productMap[unit.product_id]?.name || 'Unknown Product',
            product_code: productMap[unit.product_id]?.default_code || null
        }));
    }

    // Get barcode unit statistics
    async getStatistics() {
        await this.initialize();
        
        const totalUnits = await this.collections.barcode_units.countDocuments({
            active: { $ne: false }
        });

        const unitsWithBarcodes = await this.collections.barcode_units.countDocuments({
            barcode: { $exists: true, $ne: null, $ne: '' },
            active: { $ne: false }
        });

        const productsWithUnits = await this.collections.barcode_units.distinct('product_id', {
            active: { $ne: false }
        });

        const avgUnitsPerProduct = productsWithUnits.length > 0 ? 
            totalUnits / productsWithUnits.length : 0;

        return {
            total_units: totalUnits,
            units_with_barcodes: unitsWithBarcodes,
            products_with_units: productsWithUnits.length,
            avg_units_per_product: Math.round(avgUnitsPerProduct * 100) / 100
        };
    }

    // Search barcode units
    async search(searchTerm, limit = 50) {
        await this.initialize();
        
        const searchRegex = new RegExp(searchTerm, 'i');
        const barcodeUnits = await this.collections.barcode_units.find({
            $or: [
                { name: searchRegex },
                { barcode: searchRegex }
            ],
            active: { $ne: false }
        }).limit(limit).toArray();

        // Get product information
        const productIds = [...new Set(barcodeUnits.map(unit => unit.product_id))];
        const products = await this.collections.products.find({
            product_id: { $in: productIds }
        }).toArray();

        const productMap = {};
        products.forEach(product => {
            productMap[product.product_id] = product;
        });

        return barcodeUnits.map(unit => ({
            id: unit.unit_id,
            name: unit.name,
            barcode: unit.barcode,
            quantity: unit.quantity,
            price: unit.price,
            product_id: unit.product_id,
            product_name: productMap[unit.product_id]?.name || 'Unknown Product'
        }));
    }

    // Validate barcode unit data
    validateUnitData(unitData) {
        const errors = [];

        if (!unitData.name || unitData.name.trim().length === 0) {
            errors.push('Unit name is required');
        }

        if (!unitData.product_id) {
            errors.push('Product ID is required');
        }

        if (unitData.quantity && unitData.quantity <= 0) {
            errors.push('Quantity must be positive');
        }

        if (unitData.price && unitData.price < 0) {
            errors.push('Price cannot be negative');
        }

        if (unitData.barcode && unitData.barcode.length < 8) {
            errors.push('Barcode must be at least 8 characters');
        }

        return errors;
    }

    // Check for duplicate barcodes
    async checkDuplicateBarcode(barcode, excludeUnitId = null) {
        await this.initialize();
        
        const query = {
            barcode: barcode,
            active: { $ne: false }
        };

        if (excludeUnitId) {
            query.unit_id = { $ne: excludeUnitId };
        }

        const existingUnit = await this.collections.barcode_units.findOne(query);
        return existingUnit ? {
            exists: true,
            unit_id: existingUnit.unit_id,
            unit_name: existingUnit.name,
            product_id: existingUnit.product_id
        } : { exists: false };
    }
}

module.exports = new BarcodeUnitsService(); 