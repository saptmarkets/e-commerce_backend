const { getCollections } = require('../models');

class ProductViewerService {
    constructor() {
        this.collections = null;
    }

    async initialize() {
        if (!this.collections) {
            this.collections = models.getCollections();
        }
    }

    async getProductBasicInfo(productId) {
        await this.initialize();
        
        const product = await this.collections.products.findOne({ 
            product_id: parseInt(productId) 
        });
        
        if (!product) {
            throw new Error('Product not found');
        }

        // Get barcode units for this product
        const barcodeUnits = await this.collections.barcode_units.find({ 
            product_id: parseInt(productId),
            active: { $ne: false }
        }).sort({ sequence: 1 }).toArray();

        return {
            id: product.product_id,
            name: product.name,
            default_code: product.default_code,
            barcode: product.barcode,
            type: product.type,
            sale_ok: product.sale_ok,
            purchase_ok: product.purchase_ok,
            list_price: product.list_price,
            standard_price: product.standard_price,
            // Multi-unit information
            barcode_unit_ids: product.barcode_unit_ids || [],
            barcode_unit_count: product.barcode_unit_count || 0,
            barcode_units: barcodeUnits.map(unit => ({
                id: unit.unit_id,
                name: unit.name,
                barcode: unit.barcode,
                quantity: unit.quantity,
                price: unit.price,
                av_cost: unit.av_cost,
                sequence: unit.sequence
            }))
        };
    }

    async getProductCategoryUom(productId) {
        await this.initialize();
        
        const product = await this.collections.products.findOne({ 
            product_id: parseInt(productId) 
        });
        
        if (!product) {
            throw new Error('Product not found');
        }

        // Get category information
        let category = null;
        if (product.category_id) {
            category = await this.collections.categories.findOne({ 
                category_id: product.category_id 
            });
        }

        // Get UoM information
        let uom = null;
        if (product.uom_id) {
            uom = await this.collections.uom.findOne({ 
                uom_id: product.uom_id 
            });
        }

        return {
            category: category ? {
                id: category.category_id,
                name: category.name,
                complete_name: category.complete_name
            } : null,
            uom: uom ? {
                id: uom.uom_id,
                name: uom.name,
                category_id: uom.category_id,
                factor: uom.factor,
                uom_type: uom.uom_type
            } : null
        };
    }

    async getProductStock(productId) {
        await this.initialize();
        
        const stockRecords = await this.collections.stock.find({ 
            product_id: parseInt(productId) 
        }).toArray();

        const totalQuantity = stockRecords.reduce((total, record) => {
            return total + (record.quantity || 0);
        }, 0);

        const totalReserved = stockRecords.reduce((total, record) => {
            return total + (record.reserved_quantity || 0);
        }, 0);

        return {
            total_quantity: totalQuantity,
            reserved_quantity: totalReserved,
            available_quantity: totalQuantity - totalReserved,
            stock_locations: stockRecords.map(record => ({
                location_id: record.location_id,
                quantity: record.quantity,
                reserved_quantity: record.reserved_quantity
            }))
        };
    }

    async getProductPricing(productId) {
        await this.initialize();
        
        // Get pricelist items for this product
        const pricelistItems = await this.collections.pricelist_items.find({ 
            $or: [
                { product_id: parseInt(productId) },
                { product_tmpl_id: parseInt(productId) }
            ]
        }).toArray();

        // Get pricelists information
        const pricelistIds = [...new Set(pricelistItems.map(item => item.pricelist_id))];
        const pricelists = await this.collections.pricelists.find({
            pricelist_id: { $in: pricelistIds }
        }).toArray();

        // Get barcode units information for multi-unit pricing
        const barcodeUnitIds = [...new Set(pricelistItems
            .filter(item => item.barcode_unit_id)
            .map(item => item.barcode_unit_id))];
        
        const barcodeUnits = await this.collections.barcode_units.find({
            unit_id: { $in: barcodeUnitIds }
        }).toArray();

        const pricelistMap = {};
        pricelists.forEach(pricelist => {
            pricelistMap[pricelist.pricelist_id] = pricelist.name;
        });

        const barcodeUnitMap = {};
        barcodeUnits.forEach(unit => {
            barcodeUnitMap[unit.unit_id] = unit.name;
        });

        return {
            pricelist_items: pricelistItems.map(item => ({
                id: item.item_id,
                pricelist_id: item.pricelist_id,
                pricelist_name: pricelistMap[item.pricelist_id] || 'Unknown',
                barcode_unit_id: item.barcode_unit_id,
                barcode_unit_name: item.barcode_unit_id ? barcodeUnitMap[item.barcode_unit_id] : null,
                min_quantity: item.min_quantity,
                max_quantity: item.max_quantity, // New field
                fixed_price: item.fixed_price,
                price_discount: item.price_discount,
                date_start: item.date_start,
                date_end: item.date_end
            }))
        };
    }

    async searchProducts(searchTerm, limit = 50) {
        await this.initialize();
        
        // Enhanced search that considers bilingual names
        const searchRegex = new RegExp(searchTerm, 'i');
        const searchQuery = {
            $or: [
                { name: searchRegex },
                { default_code: searchRegex },
                { barcode: searchRegex }
            ]
        };

        // If search term contains Arabic characters, optimize for Arabic search
        const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(searchTerm);
        
        // If search term is English/Latin, add specific English pattern search
        const isEnglish = /^[A-Za-z0-9\s&.,()×+-]+$/.test(searchTerm);
        
        if (hasArabic) {
            // For Arabic search, also look for bracketed patterns
            searchQuery.$or.push(
                { name: { $regex: `\\[.*${searchTerm}.*\\]`, $options: 'i' } }
            );
        }
        
        if (isEnglish) {
            // For English search, also look for bracketed patterns
            searchQuery.$or.push(
                { name: { $regex: `\\[.*${searchTerm}.*\\]`, $options: 'i' } }
            );
        }

        const products = await this.collections.products.find(searchQuery)
            .limit(limit)
            .sort({ write_date: -1 })
            .toArray();

        return products.map(product => {
            // Parse bilingual name for better display
            const nameInfo = this.parseBilingualName(product.name);
            let displayName = product.name;
            
            if (nameInfo.isBilingual) {
                displayName = `${nameInfo.arabicName} | ${nameInfo.englishName}`;
            }

            return {
                id: product.product_id,
                name: displayName,
                originalName: product.name,
                arabicName: nameInfo.arabicName || '',
                englishName: nameInfo.englishName || '',
                isBilingual: nameInfo.isBilingual,
                default_code: product.default_code,
                barcode: product.barcode,
                list_price: product.list_price,
                barcode_unit_count: product.barcode_unit_count || 0
            };
        });
    }

    // NEW: Search products by barcode unit barcode
    async searchByBarcodeUnit(barcode) {
        await this.initialize();
        
        const barcodeUnit = await this.collections.barcode_units.findOne({ 
            barcode: barcode,
            active: { $ne: false }
        });

        if (!barcodeUnit) {
            return null;
        }

        const product = await this.collections.products.findOne({ 
            product_id: barcodeUnit.product_id 
        });

        if (!product) {
            return null;
        }

        return {
            product: {
                id: product.product_id,
                name: product.name,
                default_code: product.default_code
            },
            barcode_unit: {
                id: barcodeUnit.unit_id,
                name: barcodeUnit.name,
                barcode: barcodeUnit.barcode,
                quantity: barcodeUnit.quantity,
                price: barcodeUnit.price
            }
        };
    }

    // NEW: Get barcode units for a specific product
    async getBarcodeUnits(productId) {
        await this.initialize();
        
        const barcodeUnits = await this.collections.barcode_units.find({ 
            product_id: parseInt(productId),
            active: { $ne: false }
        }).sort({ sequence: 1 }).toArray();

        return barcodeUnits.map(unit => ({
            id: unit.unit_id,
            name: unit.name,
            barcode: unit.barcode,
            quantity: unit.quantity,
            price: unit.price,
            av_cost: unit.av_cost,
            sequence: unit.sequence,
            purchase_qty: unit.purchase_qty,
            purchase_cost: unit.purchase_cost,
            sales_vat: unit.sales_vat,
            sale_qty: unit.sale_qty
        }));
    }

    // NEW: Get pricing for specific barcode unit
    async getBarcodeUnitPricing(barcodeUnitId) {
        await this.initialize();
        
        const pricelistItems = await this.collections.pricelist_items.find({ 
            barcode_unit_id: parseInt(barcodeUnitId)
        }).toArray();

        // Get pricelists information
        const pricelistIds = [...new Set(pricelistItems.map(item => item.pricelist_id))];
        const pricelists = await this.collections.pricelists.find({
            pricelist_id: { $in: pricelistIds }
        }).toArray();

        const pricelistMap = {};
        pricelists.forEach(pricelist => {
            pricelistMap[pricelist.pricelist_id] = pricelist.name;
        });

        return pricelistItems.map(item => ({
            id: item.item_id,
            pricelist_id: item.pricelist_id,
            pricelist_name: pricelistMap[item.pricelist_id] || 'Unknown',
            min_quantity: item.min_quantity,
            max_quantity: item.max_quantity,
            fixed_price: item.fixed_price,
            price_discount: item.price_discount,
            date_start: item.date_start,
            date_end: item.date_end
        }));
    }

    async getCompleteProductInfo(productId) {
        const basicInfo = await this.getProductBasicInfo(productId);
        const categoryUom = await this.getProductCategoryUom(productId);
        const stock = await this.getProductStock(productId);
        const pricing = await this.getProductPricing(productId);
        const barcodeUnits = await this.getBarcodeUnits(productId);

        return {
            basic: basicInfo,
            category_uom: categoryUom,
            stock: stock,
            pricing: pricing,
            barcode_units: barcodeUnits
        };
    }

    async getCollections() {
        if (!this.collections) {
            this.collections = getCollections();
        }
        return this.collections;
    }

    async getProductDetails(productId) {
        try {
            const collections = await this.getCollections();
            const productIdNum = parseInt(productId);

            // Get product details
            const product = await collections.products.findOne({ product_id: productIdNum });
            if (!product) {
                return null;
            }

            // Get related data
            const category = product.category_id ? 
                await collections.categories.findOne({ category_id: product.category_id }) : null;
            
            const uom = product.uom_id ? 
                await collections.uom.findOne({ uom_id: product.uom_id }) : null;
                
            const uom_po = product.uom_po_id ? 
                await collections.uom.findOne({ uom_id: product.uom_po_id }) : null;

            // Get stock information
            const stockRecords = await collections.stock.find({ product_id: productIdNum }).toArray();
            
            // Get pricing information (promotions)
            const promotions = collections.pricelist_items ? 
                await collections.pricelist_items.find({ product_id: productIdNum }).toArray() : [];

            // NEW: Get barcode units information
            const barcodeUnits = collections.barcode_units ? 
                await collections.barcode_units.find({ 
                    product_id: productIdNum,
                    active: { $ne: false }
                }).sort({ sequence: 1 }).toArray() : [];

            // NEW: Get pricelist information for barcode units
            const barcodeUnitIds = barcodeUnits.map(unit => unit.unit_id);
            const unitPricelists = collections.pricelist_items && barcodeUnitIds.length > 0 ? 
                await collections.pricelist_items.find({ 
                    barcode_unit_id: { $in: barcodeUnitIds }
                }).toArray() : [];

            // Get pricelist names for unit pricing
            const pricelistIds = [...new Set(unitPricelists.map(item => item.pricelist_id))];
            const pricelists = collections.pricelists && pricelistIds.length > 0 ?
                await collections.pricelists.find({
                    pricelist_id: { $in: pricelistIds }
                }).toArray() : [];

            return {
                basicInfo: this.formatBasicInfo(product),
                categoryInfo: this.formatCategoryInfo(category, uom, uom_po),
                stockInfo: this.formatStockInfo(stockRecords),
                pricingInfo: this.formatPricingInfo(product, promotions, barcodeUnits, pricelists),
                // NEW: Multi-units information
                multiUnitsInfo: this.formatMultiUnitsInfo(barcodeUnits, unitPricelists, pricelists)
            };

        } catch (error) {
            console.error('Error getting product details:', error);
            throw error;
        }
    }

    // Helper method to parse bilingual product names
    parseBilingualName(productName) {
        if (!productName) {
            return {
                originalName: '',
                arabicName: '',
                englishName: '',
                isBilingual: false
            };
        }

        // Pattern to match: [Arabic text] [English text] or similar variations
        const patterns = [
            // Pattern 1: [Arabic] [English]
            /^\s*\[\s*([^\[\]]+)\s*\]\s*\[\s*([^\[\]]+)\s*\]\s*$/,
            // Pattern 2: Arabic - English
            /^([^-]+)\s*-\s*([A-Za-z0-9\s&.,()×+-]+)$/,
            // Pattern 3: Arabic | English
            /^([^|]+)\s*\|\s*([A-Za-z0-9\s&.,()×+-]+)$/,
            // Pattern 4: Arabic / English
            /^([^/]+)\s*\/\s*([A-Za-z0-9\s&.,()×+-]+)$/
        ];

        for (const pattern of patterns) {
            const match = productName.match(pattern);
            if (match) {
                const firstPart = match[1].trim();
                const secondPart = match[2].trim();

                // Check if first part contains Arabic characters
                const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(firstPart);
                // Check if second part is primarily English/Latin
                const isEnglish = /^[A-Za-z0-9\s&.,()×+-]+$/.test(secondPart);

                if (hasArabic && isEnglish) {
                    return {
                        originalName: productName,
                        arabicName: firstPart,
                        englishName: secondPart,
                        isBilingual: true
                    };
                }
            }
        }

        // Check if the name contains Arabic characters (single language)
        const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(productName);
        const isEnglish = /^[A-Za-z0-9\s&.,()×+-]+$/.test(productName);

        if (hasArabic && !isEnglish) {
            return {
                originalName: productName,
                arabicName: productName,
                englishName: '',
                isBilingual: false
            };
        } else if (isEnglish && !hasArabic) {
            return {
                originalName: productName,
                arabicName: '',
                englishName: productName,
                isBilingual: false
            };
        }

        // Default case - mixed or unrecognized format
        return {
            originalName: productName,
            arabicName: '',
            englishName: '',
            isBilingual: false
        };
    }

    formatBasicInfo(product) {
        // Parse bilingual name
        const nameInfo = this.parseBilingualName(product.name);

        const basicInfo = [
            { field: 'Product ID', value: product.product_id?.toString() || '' },
            { field: 'Template ID', value: product.product_tmpl_id?.toString() || '' }
        ];

        // Add name fields based on parsing results
        if (nameInfo.isBilingual) {
            basicInfo.push(
                { field: 'Product Name (Original)', value: nameInfo.originalName },
                { field: 'Arabic Name (العربية)', value: nameInfo.arabicName },
                { field: 'English Name', value: nameInfo.englishName }
            );
        } else if (nameInfo.arabicName) {
            basicInfo.push(
                { field: 'Product Name (Arabic)', value: nameInfo.arabicName },
                { field: 'English Name', value: 'Not available' }
            );
        } else if (nameInfo.englishName) {
            basicInfo.push(
                { field: 'Arabic Name (العربية)', value: 'Not available' },
                { field: 'Product Name (English)', value: nameInfo.englishName }
            );
        } else {
            basicInfo.push(
                { field: 'Product Name', value: nameInfo.originalName || product.name || '' }
            );
        }

        // Add remaining fields
        basicInfo.push(
            { field: 'Default Code (SKU)', value: product.default_code || '' },
            { field: 'Barcode', value: product.barcode || '' },
            { field: 'Type', value: product.type || '' },
            { field: 'Sale OK', value: product.sale_ok ? 'Yes' : 'No' },
            { field: 'Purchase OK', value: product.purchase_ok ? 'Yes' : 'No' },
            { field: 'List Price', value: product.list_price?.toFixed(2) || '0.00' },
            { field: 'Standard Price', value: product.standard_price?.toFixed(2) || '0.00' },
            { field: 'Available Quantity', value: product.qty_available?.toFixed(2) || '0.00' },
            { field: 'Virtual Available', value: product.virtual_available?.toFixed(2) || '0.00' },
            { field: 'Last Updated', value: product.write_date ? new Date(product.write_date).toLocaleString() : '' },
            { field: 'Created', value: product.create_date ? new Date(product.create_date).toLocaleString() : '' }
        );

        return basicInfo;
    }

    formatCategoryInfo(category, uom, uom_po) {
        const info = [];
        
        if (category) {
            info.push({
                type: 'Category',
                name: category.name || '',
                details: category.complete_name || ''
            });
        } else {
            info.push({
                type: 'Category',
                name: 'Not assigned',
                details: ''
            });
        }

        if (uom) {
            info.push({
                type: 'Sale Unit of Measure',
                name: uom.name || '',
                details: `Factor: ${uom.factor || 1.0}, Type: ${uom.uom_type || 'reference'}`
            });
        } else {
            info.push({
                type: 'Sale Unit of Measure',
                name: 'Not assigned',
                details: ''
            });
        }

        if (uom_po) {
            info.push({
                type: 'Purchase Unit of Measure',
                name: uom_po.name || '',
                details: `Factor: ${uom_po.factor || 1.0}, Type: ${uom_po.uom_type || 'reference'}`
            });
        } else {
            // Only show purchase UoM if it's different from sale UoM or if sale UoM exists
            if (uom) {
                info.push({
                    type: 'Purchase Unit of Measure',
                    name: 'Same as sale unit',
                    details: ''
                });
            }
        }

        return info;
    }

    formatStockInfo(stockRecords) {
        if (!stockRecords || stockRecords.length === 0) {
            return [{
                location: 'No stock information available',
                quantity: '',
                reserved: '',
                available: ''
            }];
        }

        return stockRecords.map(stock => ({
            location: stock.location_id?.toString() || 'Unknown',
            quantity: stock.quantity?.toFixed(2) || '0.00',
            reserved: stock.reserved_quantity?.toFixed(2) || '0.00',
            available: ((stock.quantity || 0) - (stock.reserved_quantity || 0)).toFixed(2)
        }));
    }

    // Enhanced formatPricingInfo with all new fields
    formatPricingInfo(product, promotions, barcodeUnits = [], pricelists = []) {
        const pricing = [];

        // Create lookup maps
        const pricelistMap = {};
        pricelists.forEach(pricelist => {
            pricelistMap[pricelist.pricelist_id] = pricelist.name;
        });

        const barcodeUnitMap = {};
        barcodeUnits.forEach(unit => {
            barcodeUnitMap[unit.unit_id] = unit.name;
        });

        // Add base product pricing
        pricing.push({
            ruleId: 'BASE-1',
            ruleType: 'Base List Price',
            pricelist: 'Product Standard',
            appliedOn: 'Product',
            productName: product.name || 'N/A',
            barcodeUnit: 'N/A',
            barcodeUnitName: 'N/A',
            minQuantity: '1.0',
            maxQuantity: 'No limit',
            computePrice: 'Fixed',
            fixedPrice: product.list_price ? `$${product.list_price.toFixed(2)}` : '$0.00',
            priceDiscount: 'N/A',
            percentPrice: 'N/A',
            validFrom: 'Always',
            validTo: 'Always',
            active: 'Yes',
            priority: '1000',
            lastSync: 'Product sync'
        });

        pricing.push({
            ruleId: 'BASE-2',
            ruleType: 'Standard Cost',
            pricelist: 'Product Standard',
            appliedOn: 'Product',
            productName: product.name || 'N/A',
            barcodeUnit: 'N/A',
            barcodeUnitName: 'N/A',
            minQuantity: '1.0',
            maxQuantity: 'No limit',
            computePrice: 'Fixed',
            fixedPrice: product.standard_price ? `$${product.standard_price.toFixed(2)}` : '$0.00',
            priceDiscount: 'N/A',
            percentPrice: 'N/A',
            validFrom: 'Always',
            validTo: 'Always',
            active: 'Yes',
            priority: '1001',
            lastSync: 'Product sync'
        });

        // Add enhanced pricelist rules
        if (promotions && promotions.length > 0) {
            promotions.forEach(promo => {
                // Determine rule type based on applied_on field
                let appliedOn = 'Product';
                if (promo.applied_on === '3_global') appliedOn = 'Global';
                else if (promo.applied_on === '2_product_category') appliedOn = 'Category';
                else if (promo.applied_on === '1_product') appliedOn = 'Product';
                else if (promo.applied_on === '0_product_variant') appliedOn = 'Variant';

                // Determine price computation method
                let computePrice = 'Fixed';
                let fixedPrice = 'N/A';
                let priceDiscount = 'N/A';
                let percentPrice = 'N/A';

                if (promo.compute_price === 'fixed') {
                    computePrice = 'Fixed Price';
                    fixedPrice = promo.fixed_price ? `$${promo.fixed_price.toFixed(2)}` : '$0.00';
                } else if (promo.compute_price === 'percentage') {
                    computePrice = 'Percentage Discount';
                    priceDiscount = promo.price_discount ? `${promo.price_discount}%` : '0%';
                } else if (promo.compute_price === 'formula') {
                    computePrice = 'Formula';
                    percentPrice = promo.percent_price ? `${promo.percent_price}%` : 'N/A';
                }

                // Get barcode unit information if applicable
                const barcodeUnitId = promo.barcode_unit_id;
                const barcodeUnitName = barcodeUnitId ? 
                    (barcodeUnitMap[barcodeUnitId] || `Unit ${barcodeUnitId}`) : 'N/A';

                // Determine rule type with multi-unit consideration
                let ruleType = 'Standard Rule';
                if (barcodeUnitId) {
                    ruleType = 'Multi-Unit Rule';
                } else if (promo.price_discount) {
                    ruleType = 'Discount Rule';
                } else if (promo.fixed_price) {
                    ruleType = 'Fixed Price Rule';
                }

                pricing.push({
                    ruleId: promo.item_id?.toString() || 'N/A',
                    ruleType: ruleType,
                    pricelist: pricelistMap[promo.pricelist_id] || `Pricelist ${promo.pricelist_id}`,
                    appliedOn: appliedOn,
                    productName: product.name || 'N/A',
                    barcodeUnit: barcodeUnitId?.toString() || 'N/A',
                    barcodeUnitName: barcodeUnitName,
                    minQuantity: promo.min_quantity?.toString() || '1.0',
                    maxQuantity: promo.max_quantity ? promo.max_quantity.toString() : 'No limit',
                    computePrice: computePrice,
                    fixedPrice: fixedPrice,
                    priceDiscount: priceDiscount,
                    percentPrice: percentPrice,
                    validFrom: promo.date_start ? new Date(promo.date_start).toLocaleDateString() : 'No start date',
                    validTo: promo.date_end ? new Date(promo.date_end).toLocaleDateString() : 'No end date',
                    active: 'Yes', // Assuming active if in database
                    priority: this.calculateRulePriority(promo, barcodeUnitId),
                    lastSync: promo.write_date ? new Date(promo.write_date).toLocaleString() : 'Unknown'
                });
            });
        }

        // Sort by priority (lower number = higher priority)
        pricing.sort((a, b) => parseInt(a.priority) - parseInt(b.priority));

        // If no pricing rules found, add a placeholder
        if (pricing.length <= 2) { // Only base prices
            pricing.push({
                ruleId: 'NONE',
                ruleType: 'No Custom Rules',
                pricelist: 'N/A',
                appliedOn: 'N/A',
                productName: 'N/A',
                barcodeUnit: 'N/A',
                barcodeUnitName: 'N/A',
                minQuantity: 'N/A',
                maxQuantity: 'N/A',
                computePrice: 'N/A',
                fixedPrice: 'N/A',
                priceDiscount: 'N/A',
                percentPrice: 'N/A',
                validFrom: 'N/A',
                validTo: 'N/A',
                active: 'N/A',
                priority: '9999',
                lastSync: 'N/A'
            });
        }

        return pricing;
    }

    // Helper method to calculate rule priority
    calculateRulePriority(promo, barcodeUnitId) {
        let priority = 100; // Base priority

        // Multi-unit rules get higher priority
        if (barcodeUnitId) priority -= 50;

        // Specific quantity rules get higher priority
        if (promo.min_quantity && promo.min_quantity > 1) priority -= 20;
        if (promo.max_quantity) priority -= 10;

        // Date-specific rules get higher priority
        if (promo.date_start || promo.date_end) priority -= 15;

        // Fixed price rules get higher priority than discounts
        if (promo.fixed_price) priority -= 10;
        else if (promo.price_discount) priority -= 5;

        return priority.toString();
    }

    // NEW: Format multi-units information
    formatMultiUnitsInfo(barcodeUnits, unitPricelists = [], pricelists = []) {
        if (!barcodeUnits || barcodeUnits.length === 0) {
            return [{
                unitId: '',
                name: 'No barcode units configured',
                sequence: '',
                barcode: '',
                quantity: '',
                unit: '',
                price: '',
                avCost: '',
                purchaseQty: '',
                purchaseCost: '',
                salesVat: '',
                saleQty: '',
                active: '',
                pricingRules: '',
                lastSync: ''
            }];
        }

        // Create pricelist lookup maps
        const pricelistMap = {};
        pricelists.forEach(pricelist => {
            pricelistMap[pricelist.pricelist_id] = pricelist.name;
        });

        // Group pricing rules by barcode unit
        const unitPricingMap = {};
        unitPricelists.forEach(item => {
            if (!unitPricingMap[item.barcode_unit_id]) {
                unitPricingMap[item.barcode_unit_id] = [];
            }
            unitPricingMap[item.barcode_unit_id].push({
                pricelist: pricelistMap[item.pricelist_id] || `Pricelist ${item.pricelist_id}`,
                minQty: item.min_quantity || 0,
                maxQty: item.max_quantity || 'No limit',
                price: item.fixed_price ? item.fixed_price.toFixed(2) : 'N/A',
                discount: item.price_discount ? `${item.price_discount}%` : 'N/A',
                validFrom: item.date_start ? new Date(item.date_start).toLocaleDateString() : 'N/A',
                validTo: item.date_end ? new Date(item.date_end).toLocaleDateString() : 'N/A'
            });
        });

        return barcodeUnits.map(unit => {
            const pricingRules = unitPricingMap[unit.unit_id] || [];
            const pricingRulesText = pricingRules.length > 0 ? 
                pricingRules.map(rule => 
                    `${rule.pricelist}: $${rule.price} (${rule.minQty}-${rule.maxQty} qty)`
                ).join('; ') : 'No specific pricing rules';

            // Parse bilingual name for barcode unit
            const nameInfo = this.parseBilingualName(unit.name);
            let displayName = unit.name || '';
            
            if (nameInfo.isBilingual) {
                displayName = `${nameInfo.arabicName} | ${nameInfo.englishName}`;
            } else if (nameInfo.arabicName && !nameInfo.englishName) {
                displayName = `${nameInfo.arabicName} (Arabic only)`;
            } else if (nameInfo.englishName && !nameInfo.arabicName) {
                displayName = `${nameInfo.englishName} (English only)`;
            }

            return {
                unitId: unit.unit_id?.toString() || '',
                name: displayName,
                sequence: unit.sequence?.toString() || '10',
                barcode: unit.barcode || 'No barcode',
                quantity: unit.quantity?.toString() || '1.0',
                unit: unit.unit || 'Units',
                price: unit.price ? `$${unit.price.toFixed(2)}` : '$0.00',
                avCost: unit.av_cost ? `$${unit.av_cost.toFixed(2)}` : '$0.00',
                purchaseQty: unit.purchase_qty?.toString() || '0.0',
                purchaseCost: unit.purchase_cost ? `$${unit.purchase_cost.toFixed(2)}` : '$0.00',
                salesVat: unit.sales_vat ? `$${unit.sales_vat.toFixed(2)}` : '$0.00',
                saleQty: unit.sale_qty?.toString() || '0.0',
                active: unit.active !== false ? 'Yes' : 'No',
                pricingRules: pricingRulesText,
                lastSync: unit.last_sync ? new Date(unit.last_sync).toLocaleString() : 'Never'
            };
        });
    }

    async searchProducts(query = {}) {
        try {
            const collections = await this.getCollections();
            const { 
                search = '', 
                category = null, 
                page = 1, 
                limit = 10,
                minPrice = null,
                maxPrice = null,
                hasStock = null
            } = query;

            // Build MongoDB query
            const mongoQuery = {};

            // Text search across multiple fields
            if (search) {
                mongoQuery.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { default_code: { $regex: search, $options: 'i' } },
                    { barcode: { $regex: search, $options: 'i' } }
                ];
            }

            // Category filter
            if (category) {
                mongoQuery.category_id = parseInt(category);
            }

            // Price range filter
            if (minPrice !== null || maxPrice !== null) {
                mongoQuery.list_price = {};
                if (minPrice !== null) mongoQuery.list_price.$gte = parseFloat(minPrice);
                if (maxPrice !== null) mongoQuery.list_price.$lte = parseFloat(maxPrice);
            }

            // Stock filter
            if (hasStock === true) {
                mongoQuery.qty_available = { $gt: 0 };
            } else if (hasStock === false) {
                mongoQuery.qty_available = { $lte: 0 };
            }

            // Execute query with pagination
            const products = await collections.products.find(mongoQuery)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ write_date: -1 })
                .toArray();

            const total = await collections.products.countDocuments(mongoQuery);

            return {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    async getCategories() {
        try {
            const collections = await this.getCollections();
            return await collections.categories.find({}).sort({ name: 1 }).toArray();
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    }

    async getProductsByCategory(categoryId) {
        try {
            const collections = await this.getCollections();
            return await collections.products.find({ 
                category_id: parseInt(categoryId) 
            }).sort({ name: 1 }).toArray();
        } catch (error) {
            console.error('Error getting products by category:', error);
            throw error;
        }
    }

    async getStockSummary() {
        try {
            const collections = await this.getCollections();
            
            // Aggregate stock summary
            const summary = await collections.products.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        productsWithStock: { 
                            $sum: { $cond: [{ $gt: ["$qty_available", 0] }, 1, 0] } 
                        },
                        totalStockValue: { 
                            $sum: { $multiply: ["$qty_available", "$standard_price"] } 
                        },
                        averagePrice: { $avg: "$list_price" }
                    }
                }
            ]).toArray();

            return summary[0] || {
                totalProducts: 0,
                productsWithStock: 0,
                totalStockValue: 0,
                averagePrice: 0
            };

        } catch (error) {
            console.error('Error getting stock summary:', error);
            throw error;
        }
    }
}

module.exports = new ProductViewerService(); 