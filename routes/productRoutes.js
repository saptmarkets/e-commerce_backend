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

//add a product
router.post("/add", addProduct);

//add multiple products
router.post("/all", addAllProducts);

//get showing products only
router.get("/show", getShowingProducts);

//get showing products in store
router.get("/store", getShowingStoreProducts);

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

//get a product by slug
router.get("/product/:slug", getProductBySlug);

//get enhanced product by slug (with multiUnits array)
router.get("/enhanced/product/:slug", getEnhancedProductBySlug);



//update many products
router.patch("/update/many", updateManyProducts);

//delete many product
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

// Live import status check for Odoo products
router.post('/check-imported', async (req, res) => {
  try {
    const { odooProductIds } = req.body;
    if (!Array.isArray(odooProductIds) || odooProductIds.length === 0) {
      return res.status(400).json({ success: false, message: 'odooProductIds must be a non-empty array' });
    }
    const Product = require('../models/Product');
    const imported = await Product.find({ odooProductId: { $in: odooProductIds } }).select('odooProductId');
    const importedIds = imported.map(p => p.odooProductId);
    res.json({ success: true, imported: importedIds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking import status', error: error.message });
  }
});

module.exports = router;
