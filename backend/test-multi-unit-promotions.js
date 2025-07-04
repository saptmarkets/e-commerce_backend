/**
 * Test script for multi-unit promotion import functionality
 * This script helps verify that promotions for products with multiple units are imported correctly
 */

const mongoose = require('mongoose');
const OdooImportService = require('./services/odooImportService');
const OdooPricelistItem = require('./models/OdooPricelistItem');
const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
const OdooProduct = require('./models/OdooProduct');
const ProductUnit = require('./models/ProductUnit');
const Promotion = require('./models/Promotion');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Test function to analyze multi-unit promotions
const testMultiUnitPromotions = async () => {
  console.log('\n🔍 Analyzing multi-unit promotions...\n');

  try {
    // 1. Find all pricelist items with barcode_unit_id
    const itemsWithBarcodeUnits = await OdooPricelistItem.find({
      compute_price: 'fixed',
      barcode_unit_id: { $exists: true, $ne: null }
    }).lean();

    console.log(`📊 Found ${itemsWithBarcodeUnits.length} pricelist items with barcode units`);

    // 2. Group by product to see multi-unit scenarios
    const productGroups = {};
    for (const item of itemsWithBarcodeUnits) {
      if (!productGroups[item.product_id]) {
        productGroups[item.product_id] = [];
      }
      productGroups[item.product_id].push(item);
    }

    console.log(`📦 Found ${Object.keys(productGroups).length} products with multi-unit promotions`);

    // 3. Analyze each product group
    for (const [productId, items] of Object.entries(productGroups)) {
      console.log(`\n🏷️  Product ${productId}:`);
      console.log(`   - Total promotions: ${items.length}`);

      // Get product info
      const odooProduct = await OdooProduct.findOne({ product_id: parseInt(productId) });
      if (odooProduct) {
        console.log(`   - Product name: ${odooProduct.name?.en || 'N/A'}`);
        console.log(`   - Store product ID: ${odooProduct.store_product_id || 'Not imported'}`);
      }

      // Check barcode units
      const barcodeUnitIds = [...new Set(items.map(item => item.barcode_unit_id))];
      console.log(`   - Unique barcode units: ${barcodeUnitIds.length}`);

      for (const barcodeUnitId of barcodeUnitIds) {
        const barcodeUnit = await OdooBarcodeUnit.findOne({ id: barcodeUnitId });
        if (barcodeUnit) {
          console.log(`     - Barcode unit ${barcodeUnitId}: ${barcodeUnit.name} (${barcodeUnit.barcode})`);
          console.log(`       Store mapping: ${barcodeUnit.store_product_unit_id || 'Not mapped'}`);
        }
      }

      // Check import status
      const importedCount = items.filter(item => item.store_promotion_id).length;
      const pendingCount = items.filter(item => !item.store_promotion_id && item._sync_status !== 'failed').length;
      const failedCount = items.filter(item => item._sync_status === 'failed').length;

      console.log(`   - Import status: ${importedCount} imported, ${pendingCount} pending, ${failedCount} failed`);

      // Show failed items
      if (failedCount > 0) {
        const failedItems = items.filter(item => item._sync_status === 'failed');
        for (const item of failedItems) {
          console.log(`     ❌ Failed item ${item.id}: ${item._import_error}`);
        }
      }
    }

    // 4. Test import for a specific product (if any pending items exist)
    const pendingItems = await OdooPricelistItem.find({
      compute_price: 'fixed',
      barcode_unit_id: { $exists: true, $ne: null },
      store_promotion_id: { $exists: false },
      _sync_status: { $ne: 'failed' }
    }).limit(5);

    if (pendingItems.length > 0) {
      console.log(`\n🧪 Testing import for ${pendingItems.length} pending items...`);
      
      const itemIds = pendingItems.map(item => item.id);
      const result = await OdooImportService.importPromotions(itemIds);
      
      console.log(`✅ Import result: ${result.imported} imported, ${result.errors.length} errors`);
      
      if (result.errors.length > 0) {
        console.log('❌ Import errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.log('\n✅ No pending items to test import');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testMultiUnitPromotions();
  
  console.log('\n🎉 Test completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 