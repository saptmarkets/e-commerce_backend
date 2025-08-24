const express = require("express");
const router = express.Router();
const ProductUnit = require("../models/ProductUnit");
const {
  getAllProductUnits,
  getProductUnits,
  createProductUnit,
  updateProductUnit,
  deleteProductUnit,
  calculateStockRequirement,
  getBestValueUnit,
  compareUnitPricing,
  validateUnitData,
} = require("../controller/productUnitController");

// Middleware
const { isAuth, isAdmin } = require("../config/auth");

// === PRODUCT UNIT ROUTES ===

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    message: "ProductUnit routes are working!", 
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

// Direct test route - no authentication required
router.get("/direct-test/:productId", async (req, res) => {
  const ProductUnit = require("../models/ProductUnit");
  const Product = require("../models/Product");
  
  try {
    const productId = req.params.productId;
    
    // Check if product exists
    const product = await Product.findById(productId);
    const units = await ProductUnit.find({ productId }).populate('unitId');
    
    res.json({
      message: "Direct test for product units",
      timestamp: new Date(),
      productExists: !!product,
      productId,
      unitsCount: units.length,
      units: units.map(u => ({
        id: u._id,
        unitName: u.unitId?.name || 'Unknown',
        unitValue: u.unitValue,
        price: u.price
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in direct test",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Get all product units (temporarily removed authentication for testing)
router.get("/all", getAllProductUnits);

// Get all units for a specific product
router.get("/product/:productId", getProductUnits);

// Create a new unit for a product - temporarily remove auth for testing
router.post("/product/:productId", createProductUnit);

// Update a specific product unit - temporarily remove auth for testing
router.put("/product/:productId/unit/:unitId", updateProductUnit);

// Delete a product unit - temporarily remove auth for testing
router.delete("/product/:productId/unit/:unitId", deleteProductUnit);

// Calculate stock requirement for unit sale
router.post("/stock-requirement", calculateStockRequirement);

// Get best value unit for a product
router.get("/product/:productId/best-value", getBestValueUnit);

// Compare pricing between units
router.get("/product/:productId/compare", compareUnitPricing);

// Validate unit data endpoint
router.post("/validate", validateUnitData);

// Low stock alert route
router.get("/low-stock", async (req, res) => {
  try {
    // Find all product units with stock less than 10
    const lowStockUnits = await ProductUnit.find({ stock: { $lt: 10 } });
    res.json(lowStockUnits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 