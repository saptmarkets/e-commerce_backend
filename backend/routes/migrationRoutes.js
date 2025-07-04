const express = require('express');
const router = express.Router();
const createBasicUnits = require('../migrations/create-basic-units');
const createMissingProductUnits = require('../migrations/create-missing-product-units');
const runAllMigrations = require('../migrations/run-all-migrations');

// Run basic units migration
router.post('/basic-units', async (req, res) => {
  try {
    console.log('🚀 Starting Basic Units migration via API...');
    await createBasicUnits(true); // Skip connection since we're already connected
    res.json({
      success: true,
      message: 'Basic units migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Run product units migration
router.post('/product-units', async (req, res) => {
  try {
    console.log('🚀 Starting Product Units migration via API...');
    await createMissingProductUnits(true); // Skip connection since we're already connected
    res.json({
      success: true,
      message: 'Product units migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Run all migrations
router.post('/all', async (req, res) => {
  try {
    console.log('🚀 Starting complete migration via API...');
    
    // Since we're already connected, we don't need to connect again
    // Just run the migration functions directly
    console.log('=== STEP 1: Creating Basic Units ===');
    await createBasicUnits(true); // Skip connection since we're already connected
    
    console.log('=== STEP 2: Creating Missing Product Units ===');
    await createMissingProductUnits(true); // Skip connection since we're already connected
    
    res.json({
      success: true,
      message: 'All migrations completed successfully',
      details: [
        'Created basic units (pcs, kg, g, l, ml, etc.)',
        'Created ProductUnit records for all products',
        'Set proper basic units for all products',
        'Updated product hasMultiUnits flags'
      ]
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Get migration status
router.get('/status', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const ProductUnit = require('../models/ProductUnit');
    const Unit = require('../models/Unit');
    
    const totalProducts = await Product.countDocuments();
    const productsWithUnits = await Product.countDocuments({ hasMultiUnits: true });
    const totalProductUnits = await ProductUnit.countDocuments();
    const totalUnits = await Unit.countDocuments();
    
    // Get sample products without units using aggregation
    const productsWithoutUnitsAgg = await Product.aggregate([
      {
        $lookup: {
          from: 'productunits',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$productId', '$$productId'] }
                  ]
                }
              }
            }
          ],
          as: 'units'
        }
      },
      {
        $match: {
          units: { $size: 0 }
        }
      },
      {
        $limit: 5
      },
      {
        $project: {
          title: 1,
          hasMultiUnits: 1,
          basicUnit: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      status: {
        totalProducts,
        productsWithUnits,
        totalProductUnits,
        totalUnits,
        productsWithoutUnitsCount: productsWithoutUnitsAgg.length,
        needsMigration: productsWithoutUnitsAgg.length > 0,
        sampleProductsWithoutUnits: productsWithoutUnitsAgg
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message
    });
  }
});

module.exports = router; 