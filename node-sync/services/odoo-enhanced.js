const axios = require('axios');
const models = require('../models');

class OdooEnhancedService {
    constructor() {
        this.host = process.env.ODOO_HOST || 'localhost';
        this.port = process.env.ODOO_PORT || '8069';
        this.db = process.env.ODOO_DB || 'forapi_17';
        this.username = process.env.ODOO_USERNAME || 'admin';
        this.password = process.env.ODOO_PASSWORD || 'admin';
        
        this.baseUrl = `http://${this.host}:${this.port}`;
        this.jsonRpcUrl = `${this.baseUrl}/jsonrpc`;
        this.uid = null;
    }

    async authenticate() {
        try {
            console.log('Authenticating with Odoo at:', this.baseUrl);
            
            const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'common',
                    method: 'authenticate',
                    args: [this.db, this.username, this.password, {}]
                }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            if (response.data.error) {
                throw new Error(response.data.error.data?.message || 'Authentication failed');
            }

            if (response.data.result) {
                this.uid = response.data.result;
                console.log('Successfully authenticated. UID:', this.uid);
                return true;
            }

            throw new Error('Authentication failed: No UID received');
        } catch (error) {
            console.error('Authentication error:', error.message);
            throw error;
        }
    }

    async callOdoo(model, method, args = [], kwargs = {}) {
        try {
            const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [this.db, this.uid, this.password, model, method, args, kwargs]
                }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            if (response.data.error) {
                throw new Error(response.data.error.data?.message || `Error calling ${model}.${method}`);
            }

            return response.data.result;
        } catch (error) {
            console.error(`Error calling ${model}.${method}:`, error.message);
            throw error;
        }
    }

    async searchRead(model, domain, fields, offset = 0, limit = 100) {
        return await this.callOdoo(model, 'search_read', [domain], { fields, offset, limit });
    }

    async searchCount(model, domain) {
        return await this.callOdoo(model, 'search_count', [domain]);
    }

    async readRecords(model, ids, fields) {
        return await this.callOdoo(model, 'read', [ids, fields]);
    }

    // Sync methods matching Python script functionality
    async syncCategories() {
        try {
            console.log('Starting category sync...');
            const fields = ['name', 'parent_id', 'complete_name', 'create_date', 'write_date'];
            const categories = await this.searchRead('product.category', [], fields);
            
            if (!categories?.length) {
                console.log('No categories found');
                return 0;
            }

            console.log(`Found ${categories.length} categories`);
            
            const collections = models.getCollections();
            const operations = categories.map(category => ({
                updateOne: {
                    filter: { category_id: category.id },
                    update: {
                        $set: {
                            category_id: category.id,
                            name: category.name,
                            parent_id: category.parent_id?.[0] || null,
                            complete_name: category.complete_name,
                            write_date: category.write_date ? new Date(category.write_date) : new Date(),
                            create_date: category.create_date ? new Date(category.create_date) : new Date()
                        }
                    },
                    upsert: true
                }
            }));

            await this.processBulkOperations(collections.categories, operations);
            console.log(`Synced ${categories.length} categories`);
            return categories.length;
        } catch (error) {
            console.error('Error syncing categories:', error);
            throw error;
        }
    }

    async syncUom() {
        try {
            console.log('Starting UoM sync...');
            const fields = ['name', 'category_id', 'factor', 'factor_inv', 'uom_type', 'rounding'];
            const uoms = await this.searchRead('uom.uom', [], fields);
            
            if (!uoms?.length) return 0;

            console.log(`Found ${uoms.length} UoMs`);
            
            const collections = models.getCollections();
            const operations = uoms.map(uom => ({
                updateOne: {
                    filter: { uom_id: uom.id },
                    update: {
                        $set: {
                            uom_id: uom.id,
                            name: uom.name,
                            category_id: uom.category_id?.[0] || null,
                            factor: uom.factor || 1.0,
                            uom_type: uom.uom_type || 'reference',
                            rounding: uom.rounding || 0.01,
                            write_date: new Date(),
                            create_date: new Date()
                        }
                    },
                    upsert: true
                }
            }));

            await this.processBulkOperations(collections.uom, operations);
            console.log(`Synced ${uoms.length} UoMs`);
            return uoms.length;
        } catch (error) {
            console.error('Error syncing UoM:', error);
            throw error;
        }
    }

    async syncPricelists() {
        try {
            console.log('Starting pricelist sync...');
            const fields = ['name', 'currency_id', 'company_id'];
            const pricelists = await this.searchRead('product.pricelist', [], fields);
            
            if (!pricelists?.length) return 0;

            console.log(`Found ${pricelists.length} pricelists`);
            
            const collections = models.getCollections();
            const operations = pricelists.map(pricelist => ({
                updateOne: {
                    filter: { pricelist_id: pricelist.id },
                    update: {
                        $set: {
                            pricelist_id: pricelist.id,
                            name: pricelist.name,
                            currency_id: pricelist.currency_id?.[0] || null,
                            company_id: pricelist.company_id?.[0] || null,
                            write_date: new Date(),
                            create_date: new Date()
                        }
                    },
                    upsert: true
                }
            }));

            await this.processBulkOperations(collections.pricelists, operations);
            console.log(`Synced ${pricelists.length} pricelists`);
            return pricelists.length;
        } catch (error) {
            console.error('Error syncing pricelists:', error);
            throw error;
        }
    }

    async syncProducts() {
        try {
            console.log('Starting comprehensive product sync...');
            
            const templateFields = [
                'name', 'list_price', 'standard_price', 'uom_id', 
                'categ_id', 'default_code', 'type', 'sale_ok', 'purchase_ok'
            ];

            const variantFields = [
                'product_tmpl_id', 'default_code', 'barcode', 
                'lst_price', 'qty_available', 'virtual_available',
                'barcode_unit_ids', 'barcode_unit_count'
            ];

            const templateDomain = [['type', 'in', ['product', 'consu']], ['active', '=', true]];
            const templateCount = await this.searchCount('product.template', templateDomain);
            
            console.log(`Found ${templateCount} product templates`);

            const collections = models.getCollections();
            let offset = 0, limit = 100, totalProcessed = 0;

            while (offset < templateCount) {
                const templates = await this.searchRead('product.template', templateDomain, templateFields, offset, limit);
                if (!templates?.length) break;

                const templateIds = templates.map(t => t.id);
                const variants = await this.searchRead('product.product', 
                    [['product_tmpl_id', 'in', templateIds]], variantFields);

                const operations = [];
                
                for (const template of templates) {
                    const templateVariants = variants.filter(v => v.product_tmpl_id[0] === template.id);
                    
                    for (const variant of templateVariants) {
                        operations.push({
                            updateOne: {
                                filter: { product_id: variant.id },
                                update: {
                                    $set: {
                                        product_tmpl_id: template.id,
                                        product_id: variant.id,
                                        name: template.name,
                                        default_code: variant.default_code || template.default_code,
                                        barcode: variant.barcode,
                                        list_price: variant.lst_price || template.list_price || 0.0,
                                        standard_price: template.standard_price || 0.0,
                                        qty_available: variant.qty_available || 0.0,
                                        virtual_available: variant.virtual_available || 0.0,
                                        uom_id: template.uom_id?.[0] || null,
                                        category_id: template.categ_id?.[0] || null,
                                        type: template.type,
                                        sale_ok: template.sale_ok,
                                        purchase_ok: template.purchase_ok,
                                        barcode_unit_ids: variant.barcode_unit_ids || [],
                                        barcode_unit_count: variant.barcode_unit_count || 0,
                                        write_date: new Date(),
                                        create_date: new Date()
                                    }
                                },
                                upsert: true
                            }
                        });
                    }
                }

                await this.processBulkOperations(collections.products, operations);
                totalProcessed += templates.length;
                offset += limit;
                console.log(`Processed ${totalProcessed}/${templateCount} templates`);

                if (templates.length < limit) break;
            }

            console.log(`Synced ${totalProcessed} products with variants`);
            return totalProcessed;
        } catch (error) {
            console.error('Error syncing products:', error);
            throw error;
        }
    }

    async syncStock() {
        try {
            console.log('Starting stock sync...');
            const fields = ['product_id', 'location_id', 'quantity', 'reserved_quantity'];
            const stockDomain = [['location_id.usage', 'in', ['internal', 'transit']]];
            
            let offset = 0, limit = 500, totalProcessed = 0;
            const stockCount = await this.searchCount('stock.quant', stockDomain);
            console.log(`Found ${stockCount} stock records`);

            const collections = models.getCollections();

            while (offset < stockCount) {
                const quants = await this.searchRead('stock.quant', stockDomain, fields, offset, limit);
                if (!quants?.length) break;

                const operations = quants.map(quant => ({
                    updateOne: {
                        filter: { quant_id: quant.id },
                        update: {
                            $set: {
                                quant_id: quant.id,
                                product_id: quant.product_id?.[0] || null,
                                location_id: quant.location_id?.[0] || null,
                                quantity: quant.quantity || 0.0,
                                reserved_quantity: quant.reserved_quantity || 0.0,
                                write_date: new Date(),
                                create_date: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                await this.processBulkOperations(collections.stock, operations);
                totalProcessed += quants.length;
                offset += limit;
                console.log(`Processed ${totalProcessed}/${stockCount} stock records`);

                if (quants.length < limit) break;
            }

            console.log(`Synced ${totalProcessed} stock records`);
            return totalProcessed;
        } catch (error) {
            console.error('Error syncing stock:', error);
            throw error;
        }
    }

    async syncPromotions() {
        try {
            console.log('Starting enhanced promotions sync...');
            const fields = [
                'pricelist_id', 'product_tmpl_id', 'product_id', 'fixed_price', 
                'price_discount', 'min_quantity', 'date_start', 'date_end',
                'barcode_unit_id', 'max_quantity'
            ];
            
            let offset = 0, limit = 500, totalProcessed = 0;
            const itemCount = await this.searchCount('product.pricelist.item', []);
            console.log(`Found ${itemCount} pricelist items`);

            const collections = models.getCollections();

            while (offset < itemCount) {
                const items = await this.searchRead('product.pricelist.item', [], fields, offset, limit);
                if (!items?.length) break;

                const operations = items.map(item => ({
                    updateOne: {
                        filter: { item_id: item.id },
                        update: {
                            $set: {
                                item_id: item.id,
                                pricelist_id: Array.isArray(item.pricelist_id) ? item.pricelist_id[0] : item.pricelist_id,
                                product_tmpl_id: Array.isArray(item.product_tmpl_id) ? item.product_tmpl_id[0] : item.product_tmpl_id,
                                product_id: Array.isArray(item.product_id) ? item.product_id[0] : item.product_id,
                                fixed_price: item.fixed_price,
                                price_discount: item.price_discount,
                                min_quantity: item.min_quantity || 0.0,
                                date_start: item.date_start ? new Date(item.date_start) : null,
                                date_end: item.date_end ? new Date(item.date_end) : null,
                                barcode_unit_id: Array.isArray(item.barcode_unit_id) ? item.barcode_unit_id[0] : item.barcode_unit_id,
                                max_quantity: item.max_quantity,
                                write_date: new Date(),
                                create_date: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                await this.processBulkOperations(collections.pricelist_items, operations);
                totalProcessed += items.length;
                offset += limit;
                console.log(`Processed ${totalProcessed}/${itemCount} enhanced pricelist items`);

                if (items.length < limit) break;
            }

            console.log(`Synced ${totalProcessed} enhanced pricelist items`);
            return totalProcessed;
        } catch (error) {
            console.error('Error syncing enhanced promotions:', error);
            throw error;
        }
    }

    async processBulkOperations(collection, operations) {
        const batchSize = 100;
        for (let i = 0; i < operations.length; i += batchSize) {
            const batch = operations.slice(i, i + batchSize);
            try {
                await collection.bulkWrite(batch, { ordered: false });
            } catch (error) {
                if (error.code !== 11000) { // Ignore duplicate key errors
                    throw error;
                }
            }
        }
    }

    async syncBarcodeUnits() {
        try {
            console.log('Starting barcode units sync...');
            
            const fields = [
                'name', 'sequence', 'product_id', 'product_tmpl_id',
                'barcode', 'quantity', 'unit', 'price', 'av_cost',
                'purchase_qty', 'purchase_cost', 'sales_vat', 'sale_qty',
                'company_id', 'currency_id', 'active', 'create_date', 'write_date'
            ];

            let offset = 0, limit = 500, totalProcessed = 0;
            const unitCount = await this.searchCount('product.barcode.unit', []);
            console.log(`Found ${unitCount} barcode units`);

            if (!unitCount) {
                console.log('No barcode units found');
                return 0;
            }

            const collections = models.getCollections();

            while (offset < unitCount) {
                const units = await this.searchRead('product.barcode.unit', [], fields, offset, limit);
                if (!units?.length) break;

                const operations = units.map(unit => ({
                    updateOne: {
                        filter: { unit_id: unit.id },
                        update: {
                            $set: {
                                unit_id: unit.id,
                                name: unit.name,
                                sequence: unit.sequence || 10,
                                product_id: Array.isArray(unit.product_id) ? unit.product_id[0] : unit.product_id,
                                product_tmpl_id: Array.isArray(unit.product_tmpl_id) ? unit.product_tmpl_id[0] : unit.product_tmpl_id,
                                barcode: unit.barcode,
                                quantity: unit.quantity || 1.0,
                                unit: Array.isArray(unit.unit) ? unit.unit[1] : unit.unit,
                                price: unit.price || 0.0,
                                av_cost: unit.av_cost || 0.0,
                                purchase_qty: unit.purchase_qty || 0.0,
                                purchase_cost: unit.purchase_cost || 0.0,
                                sales_vat: unit.sales_vat || 0.0,
                                sale_qty: unit.sale_qty || 0.0,
                                company_id: Array.isArray(unit.company_id) ? unit.company_id[0] : unit.company_id,
                                currency_id: Array.isArray(unit.currency_id) ? unit.currency_id[0] : unit.currency_id,
                                active: unit.active !== false,
                                create_date: unit.create_date ? new Date(unit.create_date) : new Date(),
                                write_date: unit.write_date ? new Date(unit.write_date) : new Date(),
                                last_sync: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                await this.processBulkOperations(collections.barcode_units, operations);
                totalProcessed += units.length;
                offset += limit;
                console.log(`Processed ${totalProcessed}/${unitCount} barcode units`);

                if (units.length < limit) break;
            }

            console.log(`Synced ${totalProcessed} barcode units`);
            return totalProcessed;
        } catch (error) {
            console.error('Error syncing barcode units:', error);
            throw error;
        }
    }

    async syncSingleBarcodeUnit(unitId) {
        try {
            const fields = [
                'name', 'sequence', 'product_id', 'barcode', 'quantity', 
                'price', 'av_cost', 'active', 'write_date'
            ];
            
            const unit = await this.readRecords('product.barcode.unit', [unitId], fields);
            if (!unit?.length) return null;

            const collections = models.getCollections();
            const unitData = unit[0];

            await collections.barcode_units.updateOne(
                { unit_id: unitData.id },
                {
                    $set: {
                        unit_id: unitData.id,
                        name: unitData.name,
                        sequence: unitData.sequence || 10,
                        product_id: Array.isArray(unitData.product_id) ? unitData.product_id[0] : unitData.product_id,
                        barcode: unitData.barcode,
                        quantity: unitData.quantity || 1.0,
                        price: unitData.price || 0.0,
                        av_cost: unitData.av_cost || 0.0,
                        active: unitData.active !== false,
                        write_date: unitData.write_date ? new Date(unitData.write_date) : new Date(),
                        last_sync: new Date()
                    }
                },
                { upsert: true }
            );

            return unitData;
        } catch (error) {
            console.error('Error syncing single barcode unit:', error);
            throw error;
        }
    }

    async getBarcodeUnitsByProduct(productId) {
        try {
            const fields = ['name', 'barcode', 'quantity', 'price', 'sequence'];
            const units = await this.searchRead('product.barcode.unit', 
                [['product_id', '=', productId], ['active', '=', true]], 
                fields);
            
            return units.sort((a, b) => (a.sequence || 10) - (b.sequence || 10));
        } catch (error) {
            console.error('Error getting barcode units by product:', error);
            throw error;
        }
    }

    async createBarcodeUnit(unitData) {
        try {
            const data = {
                name: unitData.name,
                product_id: unitData.product_id,
                barcode: unitData.barcode,
                quantity: unitData.quantity || 1.0,
                price: unitData.price || 0.0,
                sequence: unitData.sequence || 10
            };

            const unitId = await this.callOdoo('product.barcode.unit', 'create', [data]);
            
            await this.syncSingleBarcodeUnit(unitId);
            
            return unitId;
        } catch (error) {
            console.error('Error creating barcode unit:', error);
            throw error;
        }
    }

    async syncAll() {
        try {
            if (!this.uid) await this.authenticate();

            console.log('Starting comprehensive sync with multi-units...');
            
            const results = {
                categories: await this.syncCategories(),
                uom: await this.syncUom(),
                pricelists: await this.syncPricelists(),
                products: await this.syncProducts(),
                barcode_units: await this.syncBarcodeUnits(),
                stock: await this.syncStock(),
                promotions: await this.syncPromotions()
            };

            console.log('Enhanced sync completed:', results);
            return results;
        } catch (error) {
            console.error('Enhanced sync failed:', error);
            throw error;
        }
    }
}

module.exports = new OdooEnhancedService(); 