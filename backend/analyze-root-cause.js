/**
 * Analyze root cause of promotion import issues
 */

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Analyze root cause
const analyzeRootCause = async () => {
  console.log('\n🔍 Analyzing root cause of promotion import issues...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
    const Product = require('./models/Product');
    const ProductUnit = require('./models/ProductUnit');
    const Promotion = require('./models/Promotion');
    
    // 1. Check for orphaned store_promotion_id references
    console.log('1️⃣ Checking for orphaned store_promotion_id references...');
    
    const itemsWithPromotionId = await OdooPricelistItem.find({
      store_promotion_id: { $exists: true, $ne: null }
    });
    
    let orphanedCount = 0;
    const orphanedItems = [];
    
    for (const item of itemsWithPromotionId) {
      const promotion = await Promotion.findById(item.store_promotion_id);
      if (!promotion) {
        orphanedCount++;
        orphanedItems.push({
          itemId: item.id,
          productId: item.product_id,
          barcodeUnitId: item.barcode_unit_id,
          invalidPromotionId: item.store_promotion_id
        });
      }
    }
    
    console.log(`   Found ${orphanedCount} orphaned references out of ${itemsWithPromotionId.length} total`);
    
    if (orphanedCount > 0) {
      console.log('   ❌ Root Cause #1: Orphaned store_promotion_id references');
      console.log('   💡 This happens when:');
      console.log('      - Promotions are deleted but store_promotion_id is not cleared');
      console.log('      - Import fails partway through and leaves invalid references');
      console.log('      - Database corruption or manual deletion');
    }
    
    // 2. Check for missing product mappings
    console.log('\n2️⃣ Checking for missing product mappings...');
    
    const productsWithoutMapping = await OdooProduct.find({
      store_product_id: { $exists: false }
    });
    
    console.log(`   Found ${productsWithoutMapping.length} OdooProducts without store mapping`);
    
    if (productsWithoutMapping.length > 0) {
      console.log('   ❌ Root Cause #2: Products not imported to store');
      console.log('   💡 This happens when:');
      console.log('      - Product import fails');
      console.log('      - Products are created manually in store but not synced from Odoo');
    }
    
    // 3. Check for missing barcode unit mappings
    console.log('\n3️⃣ Checking for missing barcode unit mappings...');
    
    const barcodeUnitsWithoutMapping = await OdooBarcodeUnit.find({
      store_product_unit_id: { $exists: false }
    });
    
    console.log(`   Found ${barcodeUnitsWithoutMapping.length} barcode units without store mapping`);
    
    if (barcodeUnitsWithoutMapping.length > 0) {
      console.log('   ❌ Root Cause #3: Barcode units not mapped to ProductUnits');
      console.log('   💡 This happens when:');
      console.log('      - Product units import fails');
      console.log('      - Barcode units are created after product import');
      console.log('      - Manual product unit creation without barcode mapping');
    }
    
    // 4. Check for data consistency issues
    console.log('\n4️⃣ Checking for data consistency issues...');
    
    // Check if store products exist but OdooProduct mapping is wrong
    const storeProducts = await Product.find({}).limit(10);
    let mappingIssues = 0;
    
    for (const storeProduct of storeProducts) {
      const odooProduct = await OdooProduct.findOne({ store_product_id: storeProduct._id });
      if (!odooProduct) {
        mappingIssues++;
      }
    }
    
    console.log(`   Found ${mappingIssues} potential mapping issues in sample`);
    
    if (mappingIssues > 0) {
      console.log('   ❌ Root Cause #4: Inconsistent product mappings');
      console.log('   💡 This happens when:');
      console.log('      - Products are created manually in store');
      console.log('      - Import process is interrupted');
      console.log('      - Manual database modifications');
    }
    
    // 5. Check for import process issues
    console.log('\n5️⃣ Checking import process patterns...');
    
    const failedImports = await OdooPricelistItem.find({
      _sync_status: 'failed'
    });
    
    console.log(`   Found ${failedImports.length} items with failed import status`);
    
    if (failedImports.length > 0) {
      console.log('   ❌ Root Cause #5: Failed imports not retried');
      console.log('   💡 This happens when:');
      console.log('      - Import errors are not properly handled');
      console.log('      - Failed items are not retried');
      console.log('      - Error conditions are not resolved');
    }
    
    // 6. Summary and recommendations
    console.log('\n📋 SUMMARY OF ROOT CAUSES:');
    
    const rootCauses = [];
    if (orphanedCount > 0) rootCauses.push('Orphaned promotion references');
    if (productsWithoutMapping.length > 0) rootCauses.push('Missing product mappings');
    if (barcodeUnitsWithoutMapping.length > 0) rootCauses.push('Missing barcode unit mappings');
    if (mappingIssues > 0) rootCauses.push('Inconsistent data mappings');
    if (failedImports.length > 0) rootCauses.push('Failed imports not retried');
    
    if (rootCauses.length === 0) {
      console.log('   ✅ No major issues found! System appears healthy.');
    } else {
      console.log('   ❌ Found the following root causes:');
      rootCauses.forEach((cause, index) => {
        console.log(`      ${index + 1}. ${cause}`);
      });
    }
    
    // 7. Recommendations
    console.log('\n💡 RECOMMENDATIONS TO PREVENT FUTURE ISSUES:');
    console.log('   1. Add validation to promotion deletion to clear store_promotion_id');
    console.log('   2. Implement automatic retry mechanism for failed imports');
    console.log('   3. Add data consistency checks in import process');
    console.log('   4. Implement proper error handling and rollback mechanisms');
    console.log('   5. Add monitoring for orphaned references');
    console.log('   6. Create periodic cleanup scripts for invalid mappings');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await analyzeRootCause();
  
  console.log('\n🎉 Root cause analysis completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 