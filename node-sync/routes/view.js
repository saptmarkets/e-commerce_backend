const express = require('express');
const router = express.Router();
const { initializeDb, getCollections } = require('../models');
const productViewer = require('../services/product-viewer');

// Helper to get collection safely
async function getCollection(name) {
    await initializeDb();
    const collections = getCollections();
    return collections[name];
}

router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { default_code: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            query.category_id = parseInt(category);
        }

        const productsCol = await getCollection('products');
        const products = await productsCol.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();
        const total = await productsCol.countDocuments(query);

        res.render('products', {
            products,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            search,
            category
        });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categoriesCol = await getCollection('categories');
        const categories = await categoriesCol.find().toArray();
        res.render('categories', { categories });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

// Enhanced product detail view matching Python script functionality
router.get('/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const productDetails = await productViewer.getProductDetails(productId);
        
        if (!productDetails) {
            return res.status(404).render('error', { 
                error: `Product with ID ${productId} not found` 
            });
        }

        res.render('product-detail', { 
            productId,
            productDetails,
            title: `Product ${productId} Details`
        });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

// API endpoint for product list (JSON response)
router.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { default_code: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        const productsCol = await getCollection('products');
        const products = await productsCol.find(query)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();
        const total = await productsCol.countDocuments(query);
        const pages = Math.ceil(total / limit);

        res.json({ 
            success: true,
            products,
            page,
            limit,
            total,
            pages
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint for product details (JSON response)
router.get('/api/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const productDetails = await productViewer.getProductDetails(productId);
        
        if (!productDetails) {
            return res.status(404).json({ 
                error: `Product with ID ${productId} not found` 
            });
        }

        res.json({ success: true, data: productDetails });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enhanced UoM view
router.get('/uom', async (req, res) => {
    try {
        const uomCol = await getCollection('uom');
        const uoms = await uomCol.find().sort({ name: 1 }).toArray();
        res.render('uom', { uoms, title: 'Units of Measure' });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

// API endpoint for UoM information (JSON response)
router.get('/api/uom', async (req, res) => {
    try {
        const uomCol = await getCollection('uom');
        const uoms = await uomCol.find().sort({ name: 1 }).toArray();
        
        // Group UoMs by category for better organization
        const uomsByCategory = {};
        uoms.forEach(uom => {
            const categoryId = uom.category_id || 'uncategorized';
            if (!uomsByCategory[categoryId]) {
                uomsByCategory[categoryId] = [];
            }
            uomsByCategory[categoryId].push(uom);
        });

        res.json({ 
            success: true,
            uoms,
            uomsByCategory,
            total: uoms.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Pricelists view
router.get('/pricelists', async (req, res) => {
    try {
        const pricelistsCol = await getCollection('pricelists');
        const pricelists = await pricelistsCol.find().sort({ name: 1 }).toArray();
        res.render('pricelists', { pricelists, title: 'Price Lists' });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

// Stock view
router.get('/stock', async (req, res) => {
    try {
        const stockCol = await getCollection('stock');
        const productsCol = await getCollection('products');
        
        // Get stock with product names
        const stockData = await stockCol.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            { $sort: { quantity: -1 } },
            { $limit: 100 }
        ]).toArray();

        res.render('stock', { stockData, title: 'Stock Information' });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

// Promotions view
router.get('/promotions', async (req, res) => {
    try {
        const promotionsCol = await getCollection('pricelist_items');
        if (!promotionsCol) {
            return res.render('promotions', { promotions: [], title: 'Promotions' });
        }

        const promotions = await promotionsCol.find()
            .sort({ write_date: -1 })
            .limit(50)
            .toArray();
            
        res.render('promotions', { promotions, title: 'Promotions & Price Rules' });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

// NEW: Search by barcode unit barcode
router.get('/search/barcode_unit/:barcode', async (req, res) => {
    try {
        const barcode = req.params.barcode;
        const result = await productViewer.searchByBarcodeUnit(barcode);
        
        if (!result) {
            return res.status(404).json({ error: 'Barcode unit not found' });
        }
        
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Get barcode units for a product
router.get('/product/:id/barcode_units', async (req, res) => {
    try {
        const productId = req.params.id;
        const barcodeUnits = await productViewer.getBarcodeUnits(productId);
        res.json({ success: true, barcode_units: barcodeUnits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Get pricing for specific barcode unit
router.get('/barcode_unit/:id/pricing', async (req, res) => {
    try {
        const barcodeUnitId = req.params.id;
        const pricing = await productViewer.getBarcodeUnitPricing(barcodeUnitId);
        res.json({ success: true, pricing });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
