/**
 * Comprehensive data consistency repair script
 * This script fixes all the mapping issues identified in the root cause analysis
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

// Repair data consistency
const repairDataConsistency = async () => {
  console.log('\n🔧 Starting comprehensive data consistency repair...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
    const Product = require('./models/Product');
    const ProductUnit = require('./models/ProductUnit');
    const Promotion = require('./models/Promotion');
    const OdooImportService = require('./services/odooImportService');

    let totalFixed = 0;

    // 1. Fix orphaned store_promotion_id references
    console.log('1️⃣ Fixing orphaned store_promotion_id references...');
    
    const itemsWithPromotionId = await OdooPricelistItem.find({
      store_promotion_id: { $exists: true, $ne: null }
    });
    
    let orphanedFixed = 0;
    for (const item of itemsWithPromotionId) {
      const promotion = await Promotion.findById(item.store_promotion_id);
      if (!promotion) {
        await OdooPricelistItem.updateOne(
          { id: item.id },
          { 
            $unset: { store_promotion_id: 1 }, 
            $set: { _sync_status: 'pending', _import_error: null } 
          }
        );
        orphanedFixed++;
      }
    }
    
    console.log(`   ✅ Fixed ${orphanedFixed} orphaned references`);
    totalFixed += orphanedFixed;

    // 2. Fix missing product mappings by matching SKU
    console.log('\n2️⃣ Fixing missing product mappings by SKU...');
    
    const productsWithoutMapping = await OdooProduct.find({
      store_product_id: { $exists: false }
    });
    
    let productMappingsFixed = 0;
    for (const odooProduct of productsWithoutMapping) {
      if (odooProduct.default_code) {
        const storeProduct = await Product.findOne({ sku: odooProduct.default_code });
        if (storeProduct) {
          await OdooProduct.updateOne(
            { product_id: odooProduct.product_id },
            { store_product_id: storeProduct._id }
          );
          productMappingsFixed++;
        }
      }
    }
    
    console.log(`   ✅ Fixed ${productMappingsFixed} product mappings`);
    totalFixed += productMappingsFixed;

    // 3. Fix missing barcode unit mappings
    console.log('\n3️⃣ Fixing missing barcode unit mappings...');
    
    const barcodeUnitsWithoutMapping = await OdooBarcodeUnit.find({
      store_product_unit_id: { $exists: false }
    });
    
    let barcodeMappingsFixed = 0;
    for (const barcodeUnit of barcodeUnitsWithoutMapping) {
      // Find the corresponding product unit by barcode
      if (barcodeUnit.barcode) {
        const productUnit = await ProductUnit.findOne({ barcode: barcodeUnit.barcode });
        if (productUnit) {
          await OdooBarcodeUnit.updateOne(
            { id: barcodeUnit.id },
            { store_product_unit_id: productUnit._id }
          );
          barcodeMappingsFixed++;
        }
      }
    }
    
    console.log(`   ✅ Fixed ${barcodeMappingsFixed} barcode unit mappings`);
    totalFixed += barcodeMappingsFixed;

    // 4. Fix inconsistent product mappings
    console.log('\n4️⃣ Fixing inconsistent product mappings...');
    
    const storeProducts = await Product.find({});
    let inconsistentMappingsFixed = 0;
    
    for (const storeProduct of storeProducts) {
      // Check if this store product has an OdooProduct mapping
      const odooProduct = await OdooProduct.findOne({ store_product_id: storeProduct._id });
      
      if (!odooProduct && storeProduct.sku) {
        // Try to find OdooProduct by SKU and create mapping
        const matchingOdooProduct = await OdooProduct.findOne({ default_code: storeProduct.sku });
        if (matchingOdooProduct) {
          await OdooProduct.updateOne(
            { product_id: matchingOdooProduct.product_id },
            { store_product_id: storeProduct._id }
          );
          inconsistentMappingsFixed++;
        }
      }
    }
    
    console.log(`   ✅ Fixed ${inconsistentMappingsFixed} inconsistent mappings`);
    totalFixed += inconsistentMappingsFixed;

    // 5. Retry failed imports
    console.log('\n5️⃣ Retrying failed imports...');
    
    const failedImports = await OdooPricelistItem.find({
      _sync_status: 'failed'
    });
    
    let retriedImports = 0;
    for (const failedItem of failedImports) {
      // Clear the error and retry
      await OdooPricelistItem.updateOne(
        { id: failedItem.id },
        { 
          _sync_status: 'pending',
          _import_error: null 
        }
      );
      retriedImports++;
    }
    
    console.log(`   ✅ Reset ${retriedImports} failed imports for retry`);
    totalFixed += retriedImports;

    // 6. Summary
    console.log('\n📋 REPAIR SUMMARY:');
    console.log(`   Total issues fixed: ${totalFixed}`);
    console.log(`   - Orphaned references: ${orphanedFixed}`);
    console.log(`   - Product mappings: ${productMappingsFixed}`);
    console.log(`   - Barcode unit mappings: ${barcodeMappingsFixed}`);
    console.log(`   - Inconsistent mappings: ${inconsistentMappingsFixed}`);
    console.log(`   - Failed imports reset: ${retriedImports}`);

    if (totalFixed > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   1. Run promotion import again to process the fixed items');
      console.log('   2. Monitor the import process for any remaining issues');
      console.log('   3. Run this repair script periodically (weekly/monthly)');
      console.log('   4. Consider adding this to your maintenance schedule');
    } else {
      console.log('\n✅ No issues found! Data is consistent.');
    }

  } catch (error) {
    console.error('❌ Error during repair:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await repairDataConsistency();
  
  console.log('\n🎉 Data consistency repair completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 