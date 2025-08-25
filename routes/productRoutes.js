const express = require("express");
const router = express.Router();
const {
  addProduct,
  addAllProducts,
  getAllProducts,
  getShowingProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  updateManyProducts,
  updateStatus,
  deleteProduct,
  deleteManyProducts,
  getShowingStoreProducts,
  checkProductStockAvailability,
  getEnhancedProductById,
  getEnhancedProductBySlug,
  checkCategoryHasProducts,
  testCategoryHierarchy,
} = require("../controller/productController");

// Test route to verify product routes are working
router.get("/test", (req, res) => {
  res.json({ 
    message: "Product routes are working!", 
    timestamp: new Date(),
    // Log all registered routes for debugging
    routes: router.stack
      .filter(r => r.route)
      .map(r => ({
        path: r.route.path,
        methods: Object.keys(r.route.methods).join(',')
      }))
  });
});

// Debug/Fix Basic Units endpoint - add this for admin use only
router.get("/debug/fix-basic-units", async (req, res) => {
  try {
    const Product = require("../models/Product");
    const Unit = require("../models/Unit");
    
    // Find products with missing or invalid basic units
    const productsWithIssues = await Product.find({
      $or: [
        { basicUnit: { $exists: false } },
        { basicUnit: null },
        { basicUnit: "" }
      ]
    }).select('_id title');
    
    // Find a default 'pcs' unit to use as fallback
    const pcsUnit = await Unit.findOne({
      $or: [
        { shortCode: 'pcs' },
        { name: { $regex: /piece/i } }
      ],
      isParent: true
    });
    
    if (!pcsUnit) {
      return res.status(500).json({
        success: false,
        message: "Could not find a default 'pcs' unit to use as fallback"
      });
    }
    
    // Fix products with issues
    const fixResults = [];
    for (const product of productsWithIssues) {
      const beforeFix = { ...product._doc };
      
      // Set the basic unit to the default 'pcs' unit
      product.basicUnit = pcsUnit._id;
      product.basicUnitType = pcsUnit.shortCode;
      product.hasMultiUnits = true;
      product.availableUnits = [pcsUnit._id];
      
      await product.save();
      
      fixResults.push({
        productId: product._id,
        title: product.title,
        before: beforeFix,
        after: {
          basicUnit: product.basicUnit,
          basicUnitType: product.basicUnitType
        }
      });
    }
    
    res.json({
      success: true,
      message: `Fixed ${productsWithIssues.length} products with missing or invalid basic units`,
      defaultUnit: {
        id: pcsUnit._id,
        name: pcsUnit.name,
        shortCode: pcsUnit.shortCode
      },
      fixedProducts: fixResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fixing basic units",
      error: error.message
    });
  }
});

// Direct test route
router.get("/direct-test/:id", async (req, res) => {
  const Product = require("../models/Product");
  
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    res.json({
      message: "Direct test for product",
      timestamp: new Date(),
      productExists: !!product,
      productId,
      product: product ? {
        id: product._id,
        title: product.title,
        slug: product.slug,
        basicUnit: product.basicUnit
      } : null
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in direct test",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Test endpoint to check database contents
router.get("/test-db", async (req, res) => {
  try {
    console.log("🔍 Testing database contents...");
    
    // Check categories
    const categories = await Category.find({ status: 'show' }).lean();
    console.log(`🔍 Found ${categories.length} categories`);
    
    // Check products
    const products = await Product.find({ status: 'show' }).lean();
    console.log(`🔍 Found ${products.length} products`);
    
    // Check specific category relationships
    const deliCategory = await Category.findOne({ 
      'name.en': 'Deli Section' 
    }).lean();
    
    let result = {
      totalCategories: categories.length,
      totalProducts: products.length,
      sampleCategories: categories.slice(0, 3).map(cat => ({
        id: cat._id,
        name: cat.name,
        parentId: cat.parentId
      })),
      sampleProducts: products.slice(0, 3).map(prod => ({
        id: prod._id,
        title: prod.title,
        category: prod.category,
        categories: prod.categories
      }))
    };
    
    if (deliCategory) {
      result.deliCategory = {
        id: deliCategory._id,
        name: deliCategory.name,
        parentId: deliCategory.parentId
      };
      
      // Find subcategories
      const subcategories = await Category.find({ 
        parentId: deliCategory._id.toString() 
      }).lean();
      
      result.deliSubcategories = subcategories.map(sub => ({
        id: sub._id,
        name: sub.name,
        parentId: sub.parentId
      }));
      
      // Find products in subcategories
      const subcategoryIds = subcategories.map(sub => sub._id);
      const productsInSubcategories = await Product.find({
        $or: [
          { category: { $in: subcategoryIds } },
          { categories: { $in: subcategoryIds } }
        ]
      }).lean();
      
      result.productsInDeliSubcategories = productsInSubcategories.length;
      result.sampleDeliProducts = productsInSubcategories.slice(0, 3).map(prod => ({
        id: prod._id,
        title: prod.title,
        category: prod.category,
        categories: prod.categories
      }));
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error testing database:", error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to show all category relationships
router.get("/debug-categories", async (req, res) => {
  try {
    console.log("🔍 Debugging category relationships...");
    
    // Get all categories
    const allCategories = await Category.find({ status: 'show' }).lean();
    
    // Find the Deli Section that's being accessed
    const accessedDeliSection = await Category.findById('689cb22ffc3a4400485a3e05').lean();
    
    // Find the actual parent of Soft & Hard Cheeses
    const softHardCheeses = await Category.findById('689c6b259e326547f0af4639').lean();
    const actualParent = softHardCheeses ? await Category.findById(softHardCheeses.parentId).lean() : null;
    
    // Find all categories with parentId = 689cb22ffc3a4400485a3e05 (the accessed Deli Section)
    const childrenOfAccessedDeli = allCategories.filter(cat => 
      cat.parentId === '689cb22ffc3a4400485a3e05'
    );
    
    // Find all categories with parentId = 689c6b259e326547f0af4635 (the actual parent of Soft & Hard Cheeses)
    const childrenOfActualParent = allCategories.filter(cat => 
      cat.parentId === '689c6b259e326547f0af4635'
    );
    
    const result = {
      accessedDeliSection: accessedDeliSection ? {
        id: accessedDeliSection._id,
        name: accessedDeliSection.name,
        parentId: accessedDeliSection.parentId
      } : null,
      
      softHardCheeses: softHardCheeses ? {
        id: softHardCheeses._id,
        name: softHardCheeses.name,
        parentId: softHardCheeses.parentId
      } : null,
      
      actualParent: actualParent ? {
        id: actualParent._id,
        name: actualParent.name,
        parentId: actualParent.parentId
      } : null,
      
      childrenOfAccessedDeli: childrenOfAccessedDeli.map(cat => ({
        id: cat._id,
        name: cat.name,
        parentId: cat.parentId
      })),
      
      childrenOfActualParent: childrenOfActualParent.map(cat => ({
        id: cat._id,
        name: cat.name,
        parentId: cat.parentId
      })),
      
      allCategories: allCategories.map(cat => ({
        id: cat._id,
        name: cat.name,
        parentId: cat.parentId
      }))
    };
    
    res.json(result);
  } catch (error) {
    console.error("Error debugging categories:", error);
    res.status(500).json({ error: error.message });
  }
});

//add a product
router.post("/add", addProduct);

//add multiple products
router.post("/all", addAllProducts);

//get showing products only
router.get("/show", getShowingProducts);

//get showing products in store
router.get("/store", getShowingStoreProducts);

//get discounted products (alias used by customer app)
router.get("/discounted", async (req, res) => {
  // Reuse existing discount query handler by delegating to the same logic as /discount
  req.url = req.url.replace('/discounted', '/discount');
  return router.handle(req, res);
});

//get discounted products
router.get("/discount", async (req, res) => {
  try {
    const Product = require("../models/Product");
    const products = await Product.find({
      status: "show",
      stock: { $gt: 0 },
      $or: [
        {
          $and: [
            { isCombination: true },
            { "variants.discount": { $gt: 0 } }
          ]
        },
        {
          $and: [
            { isCombination: false },
            { "prices.discount": { $gt: 0 } }
          ]
        }
      ]
    })
    .populate({ path: "category", select: "name _id" })
    .populate({ path: "basicUnit", select: "name nameAr shortCode _id" })
    .sort({ _id: -1 })
    .lean();

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
});

//get all products
router.get("/", getAllProducts);

// Alias used by customer app: /slug/:slug
router.get("/slug/:slug", (req, res, next) => {
  return getProductBySlug(req, res, next);
});

//get a product by slug
router.get("/product/:slug", getProductBySlug);

//get enhanced product by slug (with multiUnits array)
router.get("/enhanced/product/:slug", getEnhancedProductBySlug);



//update many products
router.patch("/update/many", updateManyProducts);

//delete many products
router.patch("/delete/many", deleteManyProducts);

//get a product
router.get("/:id", getProductById);

//get enhanced product by ID (with multiUnits array)
router.get("/enhanced/:id", getEnhancedProductById);

//update a product
router.patch("/:id", updateProduct);

//update a product status
router.put("/status/:id", updateStatus);

//delete a product
router.delete("/:id", deleteProduct);

//check product stock availability
router.get("/:productId/stock-availability", checkProductStockAvailability);

// Check if category has products
router.get("/category/:categoryId/has-products", checkCategoryHasProducts);

// Test category hierarchy
router.get('/test-category-hierarchy', testCategoryHierarchy);

// Live import status check for Odoo products
router.post('/check-imported', async (req, res) => {
  try {
    const { odooProductIds, autoUpdateUnits = false } = req.body;
    if (!Array.isArray(odooProductIds) || odooProductIds.length === 0) {
      return res.status(400).json({ success: false, message: 'odooProductIds must be a non-empty array' });
    }

    const Product = require('../models/Product');
    const OdooProduct = require('../models/OdooProduct'); // For Odoo temp data
    const OdooStock = require('../models/OdooStock'); // For Odoo stock data
    
    // Get store products that match these Odoo IDs
    const storeProducts = await Product.find({ 
      odooProductId: { $in: odooProductIds } 
    }).select('odooProductId price stock title locationStocks');
    
    // Get Odoo temp products for comparison
    const odooProducts = await OdooProduct.find({ 
      id: { $in: odooProductIds } 
    }).select('id list_price qty_available name');
    
    // Get Odoo stock data for all products
    const odooStockData = await OdooStock.find({ 
      product_id: { $in: odooProductIds } 
    }).select('product_id location_id location_name quantity available_quantity');
    
    // Create lookup maps for performance
    const storeProductMap = new Map();
    storeProducts.forEach(p => storeProductMap.set(p.odooProductId, p));
    
    const odooProductMap = new Map();
    odooProducts.forEach(p => odooProductMap.set(p.id, p));
    
    // Group stock data by product_id
    const stockByProduct = new Map();
    odooStockData.forEach(stock => {
      if (!stockByProduct.has(stock.product_id)) {
        stockByProduct.set(stock.product_id, []);
      }
      stockByProduct.get(stock.product_id).push(stock);
    });
    
    const results = [];
    let autoUpdatedCount = 0;
    
    for (const odooId of odooProductIds) {
      const storeProduct = storeProductMap.get(odooId);
      const odooProduct = odooProductMap.get(odooId);
      const odooStockRecords = stockByProduct.get(odooId) || [];
      
      if (!storeProduct) {
        // Product not imported
        results.push({
          odooId,
          status: 'not_imported',
          message: 'Product not found in store'
        });
        continue;
      }
      
      if (!odooProduct) {
        // Odoo product not found in temp tables
        results.push({
          odooId,
          status: 'imported',
          message: 'Product imported but Odoo data not available'
        });
        continue;
      }
      
      // Calculate total stock from Odoo locations
      const totalOdooStock = odooStockRecords.reduce((sum, stock) => sum + (stock.available_quantity || stock.quantity || 0), 0);
      
      // Check if prices and stock match
      const priceDiff = storeProduct.price !== odooProduct.list_price;
      const stockDiff = storeProduct.stock !== totalOdooStock;
      
      if (!priceDiff && !stockDiff) {
        // Everything matches - fully imported and up to date
        results.push({
          odooId,
          status: 'imported',
          message: 'Product imported and up to date',
          storePrice: storeProduct.price,
          odooPrice: odooProduct.list_price,
          storeStock: storeProduct.stock,
          odooStock: totalOdooStock,
          odooLocations: odooStockRecords.length
        });
      } else {
        // Product exists but needs update
        results.push({
          odooId,
          status: 'needs_update',
          message: 'Product imported but needs update',
          storePrice: storeProduct.price,
          odooPrice: odooProduct.list_price,
          storeStock: storeProduct.stock,
          odooStock: totalOdooStock,
          odooLocations: odooStockRecords.length,
          differences: {
            price: priceDiff ? { store: storeProduct.price, odoo: odooProduct.list_price } : null,
            stock: stockDiff ? { store: storeProduct.stock, odoo: totalOdooStock } : null
          }
        });
        
        // 🔄 AUTO-UPDATE: Update the product automatically if differences found
        try {
          const updateData = {};
          if (priceDiff) updateData.price = odooProduct.list_price;
          if (stockDiff) {
            updateData.stock = totalOdooStock;
            
            // Update locationStocks array with Odoo stock data
            const locationStocks = odooStockRecords.map(stock => ({
              qty: stock.available_quantity || stock.quantity || 0,
              locationId: stock.location_id,
              name: stock.location_name
            }));
            
            updateData.locationStocks = locationStocks;
          }
          
          if (Object.keys(updateData).length > 0) {
            await Product.updateOne(
              { odooProductId: odooId },
              { 
                $set: updateData,
                updatedAt: new Date()
              }
            );
            
            autoUpdatedCount++;
            console.log(`🔄 Auto-updated product ${odooId}:`, updateData);
          }
        } catch (updateError) {
          console.error(`❌ Failed to auto-update product ${odooId}:`, updateError.message);
          // Don't fail the entire request, just log the error
        }
      }
    }
    
            // 🔄 AUTO-UPDATE UNITS: Update unit prices if requested
        let unitUpdateResults = null;
        if (autoUpdateUnits) {
          try {
            console.log('🏷️ Starting unit price auto-update...');
            const unitAutoUpdateService = require('../services/unitAutoUpdateService');
            unitUpdateResults = await unitAutoUpdateService.autoUpdateUnits(odooProductIds);
            console.log('✅ Unit price auto-update completed');
          } catch (unitError) {
            console.error('❌ Unit price auto-update failed:', unitError.message);
            unitUpdateResults = {
              success: false,
              error: unitError.message,
              summary: { unitsUpdated: 0, unitsInserted: 0, unitsSkipped: 0, errors: 1 }
            };
          }
        }

        // Group results by status for easy frontend consumption
        const imported = results.filter(r => r.status === 'imported').map(r => r.odooId);
        const needsUpdate = results.filter(r => r.status === 'needs_update').map(r => r.odooId);
        const notImported = results.filter(r => r.status === 'not_imported').map(r => r.odooId);
        
        res.json({ 
          success: true, 
          imported,
          needsUpdate,
          notImported,
          autoUpdatedCount,
          unitUpdateResults,
          summary: {
            total: odooProductIds.length,
            imported: imported.length,
            needsUpdate: needsUpdate.length,
            notImported: notImported.length,
            autoUpdated: autoUpdatedCount
          },
          details: results // Full details for debugging
        });
    
  } catch (error) {
    console.error('Error checking import status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking import status', 
      error: error.message 
    });
  }
});

module.exports = router;
