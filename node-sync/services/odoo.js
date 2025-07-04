const axios = require('axios');
const models = require('../models');

class OdooService {    constructor() {
        this.host = process.env.ODOO_HOST || 'localhost';  // Use localhost as default
        this.port = process.env.ODOO_PORT || '8069';
        this.db = process.env.ODOO_DB || 'forapi_17';
        this.username = process.env.ODOO_USERNAME || 'admin';
        this.password = process.env.ODOO_PASSWORD || 'admin';
        
        this.baseUrl = `http://${this.host}:${this.port}`;
        this.jsonRpcUrl = `${this.baseUrl}/jsonrpc`;
        
        // Configure axios defaults with longer timeouts
        this.axiosConfig = {
            timeout: 30000,  // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            family: 4,  // Force IPv4
            validateStatus: status => status >= 200 && status < 500
        };
    }    async authenticate() {
        try {
            console.log('Attempting to connect to Odoo at:', this.baseUrl);            const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'common',
                    method: 'authenticate',
                    args: [this.db, this.username, this.password, {}]
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });

            if (response.data.error) {
                console.error('Odoo authentication error:', response.data.error);
                throw new Error(response.data.error.data?.message || 'Authentication failed');
            }

            if (response.data.result) {
                this.uid = response.data.result;
                console.log('Successfully authenticated with Odoo. UID:', this.uid);
                return true;
            }

            throw new Error('Authentication failed: No UID received');

        } catch (error) {
            console.error('Odoo authentication error:', error.message);
            
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                throw new Error(`Connection to Odoo timed out. Server might be busy or unreachable at ${this.baseUrl}`);
            } else if (error.code === 'ECONNREFUSED') {
                throw new Error(`Connection refused. Please check if Odoo is running at ${this.baseUrl}`);
            }
            
            throw error;
        }
    }    async searchRead(model, domain, fields, offset = 0, limit = 100) {
        try {
            const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [
                        this.db,
                        this.uid,
                        this.password,
                        model,
                        'search_read',
                        [domain],
                        {
                            fields,
                            offset,
                            limit
                        }
                    ]
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000
            });

            return response.data.result;
        } catch (error) {
            console.error(`Error fetching ${model}:`, error);
            throw error;
        }
    }    async searchCount(model, domain) {
        try {
            const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [
                        this.db,
                        this.uid,
                        this.password,
                        model,
                        'search_count',
                        [domain]
                    ]
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000
            });

            return response.data.result;
        } catch (error) {
            console.error(`Error counting ${model}:`, error);
            throw error;
        }
    }    async readRecords(model, ids, fields) {
        try {
            const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [
                        this.db,
                        this.uid,
                        this.password,
                        model,
                        'read',
                        [ids, fields]
                    ]
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000
            });

            return response.data.result;
        } catch (error) {
            console.error(`Error reading ${model}:`, error);
            throw error;
        }
    }    async syncCategories() {
        try {
            console.log('Starting category sync...');
            const fields = ['name', 'parent_id', 'complete_name', 'create_date', 'write_date'];
            const categories = await this.searchRead('product.category', [], fields);
            
            if (!categories || !categories.length) {
                console.log('No categories found to sync');
                return 0;
            }

            console.log(`Found ${categories.length} categories to sync`);
              // Get the categories collection
            const collections = models.getCollections();
            if (!collections) {
                throw new Error('MongoDB collections not initialized');
            }
            const categoriesCollection = collections.categories;
            
            if (!categoriesCollection) {
                throw new Error('Categories collection not initialized');
            }

            // Prepare bulk operations
            const operations = categories.map(category => ({
                updateOne: {
                    filter: { category_id: category.id },
                    update: {
                        $set: {
                            category_id: category.id,
                            name: category.name,
                            parent_id: category.parent_id ? category.parent_id[0] : null,
                            complete_name: category.complete_name,
                            write_date: category.write_date ? new Date(category.write_date) : new Date(),
                            create_date: category.create_date ? new Date(category.create_date) : new Date()
                        }
                    },
                    upsert: true
                }
            }));

            // Process in batches of 100
            const batchSize = 100;
            for (let i = 0; i < operations.length; i += batchSize) {
                const batch = operations.slice(i, i + batchSize);
                await categoriesCollection.bulkWrite(batch, { ordered: false });
                console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(operations.length/batchSize)}`);
            }

            console.log(`Successfully synced ${categories.length} categories`);
            return categories.length;

        } catch (error) {
            console.error('Error in syncCategories:', error);
            if (error.code === 11000) {
                console.error('Duplicate key error. Some categories may already exist.');
            }
            throw error;
        }
    }    async syncUom() {
        try {
            console.log('Starting UoM sync...');
            const fields = ['name', 'category_id', 'factor', 'factor_inv', 'uom_type', 'rounding', 'create_date', 'write_date'];
            const uoms = await this.searchRead('uom.uom', [], fields);
            
            if (!uoms || !uoms.length) {
                console.log('No UoMs found to sync');
                return 0;
            }

            console.log(`Found ${uoms.length} UoMs to sync`);
            
            const collections = models.getCollections();
            const uomCollection = collections.uom;
            
            const operations = uoms.map(uom => ({
                updateOne: {
                    filter: { uom_id: uom.id },
                    update: {
                        $set: {
                            uom_id: uom.id,
                            name: uom.name,
                            category_id: uom.category_id ? uom.category_id[0] : null,
                            factor: uom.factor || 1.0,
                            factor_inv: uom.factor_inv || 1.0,
                            uom_type: uom.uom_type || 'reference',
                            rounding: uom.rounding || 0.01,
                            write_date: uom.write_date ? new Date(uom.write_date) : new Date(),
                            create_date: uom.create_date ? new Date(uom.create_date) : new Date()
                        }
                    },
                    upsert: true
                }
            }));

            const batchSize = 100;
            for (let i = 0; i < operations.length; i += batchSize) {
                const batch = operations.slice(i, i + batchSize);
                await uomCollection.bulkWrite(batch, { ordered: false });
                console.log(`Processed UoM batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(operations.length/batchSize)}`);
            }

            console.log(`Successfully synced ${uoms.length} UoMs`);
            return uoms.length;

        } catch (error) {
            console.error('Error in syncUom:', error);
            throw error;
        }
    }    async syncPricelists() {
        try {
            console.log('Starting pricelist sync...');
            const fields = ['name', 'currency_id', 'company_id', 'create_date', 'write_date'];
            const pricelists = await this.searchRead('product.pricelist', [], fields);
            
            if (!pricelists || !pricelists.length) {
                console.log('No pricelists found to sync');
                return 0;
            }

            console.log(`Found ${pricelists.length} pricelists to sync`);
            
            const collections = models.getCollections();
            const pricelistsCollection = collections.pricelists;
            
            const operations = pricelists.map(pricelist => ({
                updateOne: {
                    filter: { pricelist_id: pricelist.id },
                    update: {
                        $set: {
                            pricelist_id: pricelist.id,
                            name: pricelist.name,
                            currency_id: pricelist.currency_id ? pricelist.currency_id[0] : null,
                            company_id: pricelist.company_id ? pricelist.company_id[0] : null,
                            write_date: pricelist.write_date ? new Date(pricelist.write_date) : new Date(),
                            create_date: pricelist.create_date ? new Date(pricelist.create_date) : new Date()
                        }
                    },
                    upsert: true
                }
            }));

            const batchSize = 100;
            for (let i = 0; i < operations.length; i += batchSize) {
                const batch = operations.slice(i, i + batchSize);
                await pricelistsCollection.bulkWrite(batch, { ordered: false });
                console.log(`Processed pricelist batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(operations.length/batchSize)}`);
            }

            console.log(`Successfully synced ${pricelists.length} pricelists`);
            return pricelists.length;

        } catch (error) {
            console.error('Error in syncPricelists:', error);
            throw error;
        }
    }    async syncProducts() {
        try {
            console.log('Starting comprehensive product sync...');
            
            // First sync product templates
            const templateFields = [
                'id', 'name', 'list_price', 'standard_price',
                'uom_id', 'uom_po_id', 'categ_id', 'default_code',
                'type', 'description_sale', 'active', 'sale_ok',
                'purchase_ok', 'create_date', 'write_date',
                'attribute_line_ids'
            ];

            // Get templates with active filter
            const templateDomain = [['type', 'in', ['product', 'consu']], ['active', '=', true]];
            const templateCount = await this.searchCount('product.template', templateDomain);
            console.log(`Found ${templateCount} product templates to sync`);

            const collections = models.getCollections();
            const productsCollection = collections.products;
            
            let offset = 0;
            const limit = 100;
            let totalProcessed = 0;

            while (offset < templateCount) {
                const templates = await this.searchRead('product.template', templateDomain, templateFields, offset, limit);
                
                if (!templates || !templates.length) {
                    break;
                }

                // Get variants for these templates
                const templateIds = templates.map(t => t.id);
                const variantFields = [
                    'id', 'product_tmpl_id', 'default_code', 'barcode',
                    'standard_price', 'lst_price', 'qty_available',
                    'virtual_available', 'product_template_attribute_value_ids',
                    'create_date', 'write_date'
                ];

                const variants = await this.searchRead('product.product', [['product_tmpl_id', 'in', templateIds]], variantFields);

                // Process each template with its variants
                const operations = [];
                for (const template of templates) {
                    const templateVariants = variants.filter(v => v.product_tmpl_id[0] === template.id);
                    
                    for (const variant of templateVariants) {
                        // Get attribute values if present
                        let attributeValues = [];
                        if (variant.product_template_attribute_value_ids && variant.product_template_attribute_value_ids.length > 0) {
                            try {
                                const attrValues = await this.readRecords(
                                    'product.template.attribute.value',
                                    variant.product_template_attribute_value_ids,
                                    ['attribute_id', 'name']
                                );
                                attributeValues = attrValues.map(av => ({
                                    attribute_id: av.attribute_id[0],
                                    attribute_name: av.attribute_id[1],
                                    value: av.name
                                }));
                            } catch (error) {
                                console.warn(`Warning: Could not fetch attribute values for product ${variant.id}: ${error.message}`);
                            }
                        }

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
                                        standard_price: variant.standard_price || template.standard_price || 0.0,
                                        qty_available: variant.qty_available || 0.0,
                                        virtual_available: variant.virtual_available || 0.0,
                                        uom_id: template.uom_id ? template.uom_id[0] : null,
                                        uom_po_id: template.uom_po_id ? template.uom_po_id[0] : null,
                                        category_id: template.categ_id ? template.categ_id[0] : null,
                                        type: template.type,
                                        sale_ok: template.sale_ok,
                                        purchase_ok: template.purchase_ok,
                                        description_sale: template.description_sale,
                                        attributes: attributeValues,
                                        write_date: variant.write_date ? new Date(variant.write_date) : new Date(),
                                        create_date: variant.create_date ? new Date(variant.create_date) : new Date()
                                    }
                                },
                                upsert: true
                            }
                        });
                    }
                }

                // Process in smaller batches
                const batchSize = 50;
                for (let i = 0; i < operations.length; i += batchSize) {
                    const batch = operations.slice(i, i + batchSize);
                    await productsCollection.bulkWrite(batch, { ordered: false })
                        .catch(error => {
                            if (error.code === 11000) {
                                console.warn('Duplicate product entries found, continuing...');
                            } else {
                                throw error;
                            }
                        });
                }

                totalProcessed += templates.length;
                offset += limit;
                console.log(`Processed ${totalProcessed}/${templateCount} product templates`);

                if (templates.length < limit) {
                    break;
                }
            }

            console.log(`Successfully synced ${totalProcessed} products with variants`);
            return totalProcessed;

        } catch (error) {
            console.error('Error in syncProducts:', error);
            throw error;
        }
    }    async syncStock() {
        try {
            console.log('Starting stock sync...');
            const fields = [
                'id', 'product_id', 'location_id', 'lot_id',
                'package_id', 'owner_id', 'quantity',
                'reserved_quantity', 'available_quantity',
                'create_date', 'write_date'
            ];

            // Get stock quants from internal and transit locations
            const stockDomain = [['location_id.usage', 'in', ['internal', 'transit']]];
            const stockCount = await this.searchCount('stock.quant', stockDomain);
            console.log(`Found ${stockCount} stock records to sync`);

            const collections = models.getCollections();
            const stockCollection = collections.stock;
            
            let offset = 0;
            const limit = 500;
            let totalProcessed = 0;

            while (offset < stockCount) {
                const quants = await this.searchRead('stock.quant', stockDomain, fields, offset, limit);
                
                if (!quants || !quants.length) {
                    break;
                }

                const operations = quants.map(quant => ({
                    updateOne: {
                        filter: { quant_id: quant.id },
                        update: {
                            $set: {
                                quant_id: quant.id,
                                product_id: quant.product_id ? quant.product_id[0] : null,
                                location_id: quant.location_id ? quant.location_id[0] : null,
                                lot_id: quant.lot_id ? quant.lot_id[0] : null,
                                package_id: quant.package_id ? quant.package_id[0] : null,
                                owner_id: quant.owner_id ? quant.owner_id[0] : null,
                                quantity: quant.quantity || 0.0,
                                reserved_quantity: quant.reserved_quantity || 0.0,
                                available_quantity: quant.available_quantity || 0.0,
                                write_date: quant.write_date ? new Date(quant.write_date) : new Date(),
                                create_date: quant.create_date ? new Date(quant.create_date) : new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                const batchSize = 100;
                for (let i = 0; i < operations.length; i += batchSize) {
                    const batch = operations.slice(i, i + batchSize);
                    await stockCollection.bulkWrite(batch, { ordered: false });
                }

                totalProcessed += quants.length;
                offset += limit;
                console.log(`Processed ${totalProcessed}/${stockCount} stock records`);

                if (quants.length < limit) {
                    break;
                }
            }

            console.log(`Successfully synced ${totalProcessed} stock records`);
            return totalProcessed;

        } catch (error) {
            console.error('Error in syncStock:', error);
            throw error;
        }
    }    async syncPromotions() {
        try {
            console.log('Starting promotions (pricelist items) sync...');
            const fields = [
                'id', 'pricelist_id', 'product_tmpl_id', 'product_id',
                'fixed_price', 'price_discount', 'price_surcharge',
                'price_round', 'price_min_margin', 'price_max_margin',
                'company_id', 'currency_id', 'min_quantity',
                'date_start', 'date_end', 'compute_price', 'base',
                'percent_price', 'applied_on', 'base_pricelist_id',
                'write_date', 'create_date'
            ];

            const itemCount = await this.searchCount('product.pricelist.item', []);
            console.log(`Found ${itemCount} pricelist items to sync`);

            const collections = models.getCollections();
            const promotionsCollection = collections.pricelist_items || collections.promotions;
            
            let offset = 0;
            const limit = 500;
            let totalProcessed = 0;

            while (offset < itemCount) {
                const items = await this.searchRead('product.pricelist.item', [], fields, offset, limit);
                
                if (!items || !items.length) {
                    break;
                }

                const operations = items.map(item => ({
                    updateOne: {
                        filter: { item_id: item.id },
                        update: {
                            $set: {
                                item_id: item.id,
                                pricelist_id: item.pricelist_id ? item.pricelist_id[0] : null,
                                product_tmpl_id: item.product_tmpl_id ? item.product_tmpl_id[0] : null,
                                product_id: item.product_id ? item.product_id[0] : null,
                                fixed_price: item.fixed_price,
                                price_discount: item.price_discount,
                                price_surcharge: item.price_surcharge,
                                price_round: item.price_round,
                                price_min_margin: item.price_min_margin,
                                price_max_margin: item.price_max_margin,
                                company_id: item.company_id ? item.company_id[0] : null,
                                currency_id: item.currency_id ? item.currency_id[0] : null,
                                min_quantity: item.min_quantity || 0.0,
                                date_start: item.date_start ? new Date(item.date_start) : null,
                                date_end: item.date_end ? new Date(item.date_end) : null,
                                compute_price: item.compute_price,
                                base: item.base,
                                percent_price: item.percent_price,
                                applied_on: item.applied_on,
                                base_pricelist_id: item.base_pricelist_id ? item.base_pricelist_id[0] : null,
                                write_date: item.write_date ? new Date(item.write_date) : new Date(),
                                create_date: item.create_date ? new Date(item.create_date) : new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                const batchSize = 100;
                for (let i = 0; i < operations.length; i += batchSize) {
                    const batch = operations.slice(i, i + batchSize);
                    await promotionsCollection.bulkWrite(batch, { ordered: false });
                }

                totalProcessed += items.length;
                offset += limit;
                console.log(`Processed ${totalProcessed}/${itemCount} pricelist items`);

                if (items.length < limit) {
                    break;
                }
            }

            console.log(`Successfully synced ${totalProcessed} pricelist items`);
            return totalProcessed;

        } catch (error) {
            console.error('Error in syncPromotions:', error);
            throw error;
        }
    }    async syncAll() {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                if (!this.uid) {
                    await this.authenticate();
                }

                console.log('Starting comprehensive sync process...');
                const results = {
                    categories: await this.syncCategories(),
                    uom: await this.syncUom(),
                    pricelists: await this.syncPricelists(),
                    products: await this.syncProducts(),
                    stock: await this.syncStock(),
                    promotions: await this.syncPromotions()
                };

                console.log('Sync completed successfully:', results);
                return results;

            } catch (error) {
                console.error(`Sync attempt ${retryCount + 1} failed:`, error.message);
                retryCount++;

                if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
                    if (retryCount < maxRetries) {
                        console.log(`Retrying in 5 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }
                }

                throw new Error(`Sync failed after ${retryCount} attempts: ${error.message}`);
            }
        }
    }

    // Helper method to handle retries
    async retryOperation(operation, maxRetries = 3, delay = 5000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    console.log(`Waiting ${delay/1000} seconds before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }
}

module.exports = new OdooService();
