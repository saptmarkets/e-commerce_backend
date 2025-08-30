const express = require('express');
const router = express.Router();
const OdooService = require('../services/odooService');
const odooService = new OdooService();
const odooSyncController = require('../controller/odooSyncController');

// Test Odoo connection
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🧪 Testing Odoo connection...');
    
    const connectionResult = await odooService.testConnection();
    const serverInfo = await odooService.getServerInfo();
    
    res.json({
      success: true,
      message: 'Odoo connection successful',
      connection: connectionResult,
      serverInfo: serverInfo
    });
  } catch (error) {
    console.error('❌ Odoo connection test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Odoo connection failed',
      error: error.message
    });
  }
});

// Get server info
router.get('/server-info', async (req, res) => {
  try {
    const serverInfo = await odooService.getServerInfo();
    res.json({
      success: true,
      serverInfo: serverInfo
    });
  } catch (error) {
    console.error('❌ Error getting server info:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get server info',
      error: error.message
    });
  }
});

// Get categories for sync selection - using local Odoo data instead of live API calls
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Fetching categories for sync selection from local Odoo data...');
    
    // Use local OdooCategory data instead of live Odoo API calls
    const OdooCategory = require('../models/OdooCategory');
    
    const categories = await OdooCategory.find({ is_active: true })
      .sort({ complete_name: 1 })
      .lean();
    
    // Group by main categories (parent_id = null) and count products
    const mainCategories = categories.filter(cat => !cat.parent_id);
    const categoriesWithCount = mainCategories.map(mainCat => {
      const subCategories = categories.filter(cat => 
        cat.parent_id === mainCat.id || 
        (cat.parent_id && categories.find(p => p.id === cat.parent_id)?.parent_id === mainCat.id)
      );
      
      const totalProducts = subCategories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);
      
      return {
        id: mainCat.id,
        name: mainCat.name,
        complete_name: mainCat.name,
        product_count: totalProducts,
        is_main_category: true,
        description: `Main category containing ${totalProducts} products across all subcategories`
      };
    });
    
    // Sort by product count (highest first) then by name
    categoriesWithCount.sort((a, b) => {
      if (b.product_count !== a.product_count) {
        return b.product_count - a.product_count;
      }
      return a.name.localeCompare(b.name);
    });
    
    console.log(`✅ Found ${categoriesWithCount.length} main categories from local data`);
    
    res.json({
      success: true,
      categories: categoriesWithCount,
      total: categoriesWithCount.length
    });
  } catch (error) {
    console.error('❌ Error fetching categories from local data:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories from local data',
      error: error.message
    });
  }
});

// Sync products by category
router.post('/sync-category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log(`🔄 Starting sync for category ID: ${categoryId}`);
    
    const result = await odooService.syncProductsByCategory(categoryId);
    
    res.json({
      success: true,
      message: `Successfully synced category: ${result.category.complete_name}`,
      data: result
    });
  } catch (error) {
    console.error(`❌ Error syncing category ${req.params.categoryId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync category',
      error: error.message
    });
  }
});

// Sync multiple categories
router.post('/sync-categories', async (req, res) => {
  try {
    const { categoryIds } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        message: 'categoryIds array is required'
      });
    }
    
    console.log(`🔄 Starting sync for ${categoryIds.length} categories:`, categoryIds);
    
    const results = [];
    const errors = [];
    
    for (const categoryId of categoryIds) {
      try {
        console.log(`📦 Syncing category ${categoryId}...`);
        const result = await odooService.syncProductsByCategory(categoryId);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error syncing category ${categoryId}:`, error.message);
        errors.push({
          categoryId: categoryId,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${results.length} categories successfully`,
      results: results,
      errors: errors,
      summary: {
        total: categoryIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('❌ Error in bulk category sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync categories',
      error: error.message
    });
  }
});

// Get products by category
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 500, offset = 0 } = req.query;
    
    console.log(`📦 Fetching products for category ${categoryId}`);
    
    const products = await odooService.fetchProductsByCategory(
      categoryId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      products: products,
      total: products.length,
      categoryId: categoryId
    });
  } catch (error) {
    console.error(`❌ Error fetching products for category ${req.params.categoryId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Get stock levels by category
router.get('/stock/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 500, offset = 0 } = req.query;
    
    console.log(`📊 Fetching stock levels for category ${categoryId}`);
    
    const stockLevels = await odooService.fetchStockByCategory(
      categoryId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      stockLevels: stockLevels,
      total: stockLevels.length,
      categoryId: categoryId
    });
  } catch (error) {
    console.error(`❌ Error fetching stock for category ${req.params.categoryId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock levels',
      error: error.message
    });
  }
});

// Legacy sync endpoints (for backward compatibility)
router.post('/sync-products', async (req, res) => {
  try {
    console.log('🔄 Starting legacy product sync...');
    
    const products = await odooService.fetchProducts();
    
    res.json({
      success: true,
      message: `Successfully synced ${products.length} products`,
      products: products,
      total: products.length
    });
  } catch (error) {
    console.error('❌ Error in legacy product sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync products',
      error: error.message
    });
  }
});

router.post('/sync-categories-legacy', async (req, res) => {
  try {
    console.log('🔄 Starting legacy category sync...');
    
    const categories = await odooService.fetchCategories();
    
    res.json({
      success: true,
      message: `Successfully synced ${categories.length} categories`,
      categories: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('❌ Error in legacy category sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync categories',
      error: error.message
    });
  }
});

// Sync selected categories with updated prices
router.post('/sync-selected-categories', odooSyncController.syncSelectedCategories);

module.exports = router; 