/**
 * Fix script specifically for Britannia product unit mapping issues
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

// Fix Britannia product
const fixBritanniaProduct = async () => {
  console.log('\n🔧 Fixing Britannia Product Unit Mapping...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
    const Product = require('./models/Product');
    const ProductUnit = require('./models/ProductUnit');
    const OdooImportService = require('./services/odooImportService');

    // 1. Find the Britannia product
    const storeProduct = await Product.findOne({ sku: 'CONS_0351' });
    if (!storeProduct) {
      console.log('❌ Britannia product not found in store');
      return;
    }

    console.log(`1️⃣ Found Britannia product: ${storeProduct._id}`);
    console.log(`   Current availableUnits: ${storeProduct.availableUnits.length}`);

    // 2. Find the OdooProduct
    const odooProduct = await OdooProduct.findOne({ product_id: 4829 });
    if (!odooProduct) {
      console.log('❌ OdooProduct not found for Britannia');
      return;
    }

    console.log(`2️⃣ Found OdooProduct: ${odooProduct.product_id}`);
    console.log(`   Store mapping: ${odooProduct.store_product_id}`);

    // 3. Clean up existing broken ProductUnits
    console.log('\n3️⃣ Cleaning up existing broken ProductUnits...');
    
    // Find ProductUnits that exist in availableUnits but don't actually exist
    const existingUnitIds = [];
    for (const unitId of storeProduct.availableUnits) {
      const unit = await ProductUnit.findById(unitId);
      if (unit) {
        existingUnitIds.push(unitId);
        console.log(`   ✅ Found existing unit: ${unit._id} (${unit.name})`);
      } else {
        console.log(`   ❌ Unit ${unitId} in availableUnits but doesn't exist in database`);
      }
    }

    // Find ProductUnits that exist for this product but aren't in availableUnits
    const allProductUnits = await ProductUnit.find({ product: storeProduct._id });
    console.log(`   Found ${allProductUnits.length} total ProductUnits for this product`);
    
    for (const unit of allProductUnits) {
      if (!storeProduct.availableUnits.includes(unit._id)) {
        console.log(`   ⚠️  Unit ${unit._id} (${unit.name}) exists but not in availableUnits`);
      }
    }

    // 4. Re-import product units using the improved logic
    console.log('\n4️⃣ Re-importing product units with improved logic...');
    
    const importService = new OdooImportService();
    
    try {
      const result = await importService.importProductUnits(odooProduct, storeProduct);
      console.log(`✅ Import completed: ${result.units} units processed`);
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }

    // 5. Verify the results
    console.log('\n5️⃣ Verifying results...');
    
    // Reload the store product
    const updatedProduct = await Product.findById(storeProduct._id);
    console.log(`   Updated availableUnits: ${updatedProduct.availableUnits.length}`);
    
    // Check each unit
    for (const unitId of updatedProduct.availableUnits) {
      const unit = await ProductUnit.findById(unitId);
      if (unit) {
        console.log(`   ✅ Unit ${unit._id}: ${unit.name} (${unit.barcode})`);
        
        // Check if it's mapped to an OdooBarcodeUnit
        const barcodeUnit = await OdooBarcodeUnit.findOne({ store_product_unit_id: unit._id });
        if (barcodeUnit) {
          console.log(`      🔗 Mapped to OdooBarcodeUnit: ${barcodeUnit.id} (${barcodeUnit.name})`);
        } else {
          console.log(`      ⚠️  Not mapped to any OdooBarcodeUnit`);
        }
      } else {
        console.log(`   ❌ Unit ${unitId} still doesn't exist!`);
      }
    }

    // 6. Test promotion import
    console.log('\n6️⃣ Testing promotion import...');
    
    try {
      const promotionResult = await importService.importPromotions();
      console.log(`✅ Promotion import completed: ${promotionResult.imported} imported`);
      
      if (promotionResult.errors.length > 0) {
        console.log('⚠️  Promotion import errors:');
        promotionResult.errors.forEach(error => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error('❌ Promotion import failed:', error.message);
    }

    console.log('\n🎉 Britannia product fix completed!');

  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixBritanniaProduct();
  
  console.log('\n🎉 Fix script completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 