/**
 * Debug script for Britannia product mapping issues
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

// Debug Britannia mapping
const debugBritanniaMapping = async () => {
  console.log('\n🔍 Debugging Britannia Product Mapping...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
    const Product = require('./models/Product');
    const ProductUnit = require('./models/ProductUnit');
    const OdooPricelistItem = require('./models/OdooPricelistItem');

    // 1. Find the Britannia product
    const storeProduct = await Product.findOne({ sku: 'CONS_0351' });
    console.log('1️⃣ Store Product Found:');
    console.log(`   ID: ${storeProduct._id}`);
    console.log(`   SKU: ${storeProduct.sku}`);
    console.log(`   Title: ${storeProduct.title.en}`);
    console.log(`   Available Units: ${storeProduct.availableUnits.length}`);
    storeProduct.availableUnits.forEach((unitId, index) => {
      console.log(`     Unit ${index + 1}: ${unitId}`);
    });

    // 2. Find the OdooProduct mapping
    const odooProduct = await OdooProduct.findOne({ product_id: 4829 });
    console.log('\n2️⃣ OdooProduct Mapping:');
    console.log(`   Product ID: ${odooProduct.product_id}`);
    console.log(`   Store Product ID: ${odooProduct.store_product_id}`);
    console.log(`   Barcode Unit IDs: ${odooProduct.barcode_unit_ids.join(', ')}`);
    console.log(`   Mapping Status: ${odooProduct.store_product_id ? '✅ Mapped' : '❌ Not Mapped'}`);

    // 3. Check barcode units
    console.log('\n3️⃣ Barcode Units Analysis:');
    for (const barcodeUnitId of odooProduct.barcode_unit_ids) {
      const barcodeUnit = await OdooBarcodeUnit.findOne({ id: barcodeUnitId });
      if (barcodeUnit) {
        console.log(`   Barcode Unit ${barcodeUnitId}:`);
        console.log(`     Name: ${barcodeUnit.name}`);
        console.log(`     Barcode: ${barcodeUnit.barcode}`);
        console.log(`     Store Product Unit ID: ${barcodeUnit.store_product_unit_id || '❌ NOT MAPPED'}`);
        
        if (barcodeUnit.store_product_unit_id) {
          const productUnit = await ProductUnit.findById(barcodeUnit.store_product_unit_id);
          if (productUnit) {
            console.log(`     ✅ Mapped to: ${productUnit.name} (${productUnit._id})`);
          } else {
            console.log(`     ❌ Mapped to non-existent ProductUnit: ${barcodeUnit.store_product_unit_id}`);
          }
        }
      } else {
        console.log(`   ❌ Barcode Unit ${barcodeUnitId} not found in OdooBarcodeUnit collection`);
      }
    }

    // 4. Check store ProductUnits
    console.log('\n4️⃣ Store ProductUnits:');
    for (const unitId of storeProduct.availableUnits) {
      const productUnit = await ProductUnit.findById(unitId);
      if (productUnit) {
        console.log(`   ProductUnit ${productUnit._id}:`);
        console.log(`     Name: ${productUnit.name}`);
        console.log(`     Barcode: ${productUnit.barcode || 'No barcode'}`);
        console.log(`     Is Default: ${productUnit.isDefault}`);
        
        // Check if this unit is mapped to any OdooBarcodeUnit
        const mappedBarcodeUnit = await OdooBarcodeUnit.findOne({ store_product_unit_id: productUnit._id });
        if (mappedBarcodeUnit) {
          console.log(`     ✅ Mapped to OdooBarcodeUnit: ${mappedBarcodeUnit.id} (${mappedBarcodeUnit.name})`);
        } else {
          console.log(`     ❌ NOT MAPPED to any OdooBarcodeUnit`);
        }
      } else {
        console.log(`   ❌ ProductUnit ${unitId} not found`);
      }
    }

    // 5. Check pricelist items
    console.log('\n5️⃣ Pricelist Items for Britannia:');
    const pricelistItems = await OdooPricelistItem.find({ 
      product_id: odooProduct.product_id,
      compute_price: 'fixed'
    });
    
    console.log(`   Found ${pricelistItems.length} fixed-price pricelist items`);
    
    for (const item of pricelistItems) {
      console.log(`   Item ${item.id}:`);
      console.log(`     Product ID: ${item.product_id}`);
      console.log(`     Barcode Unit ID: ${item.barcode_unit_id || 'None'}`);
      console.log(`     Fixed Price: ${item.fixed_price}`);
      console.log(`     Store Promotion ID: ${item.store_promotion_id || 'None'}`);
      console.log(`     Sync Status: ${item._sync_status || 'pending'}`);
      
      if (item.barcode_unit_id) {
        const barcodeUnit = await OdooBarcodeUnit.findOne({ id: item.barcode_unit_id });
        if (barcodeUnit) {
          console.log(`     Barcode Unit: ${barcodeUnit.name} (${barcodeUnit.barcode})`);
          console.log(`     Store Mapping: ${barcodeUnit.store_product_unit_id || '❌ NOT MAPPED'}`);
        } else {
          console.log(`     ❌ Barcode Unit ${item.barcode_unit_id} not found`);
        }
      }
    }

    // 6. Summary and recommendations
    console.log('\n📋 SUMMARY:');
    
    const barcodeUnits = await OdooBarcodeUnit.find({ id: { $in: odooProduct.barcode_unit_ids } });
    const unmappedBarcodeUnits = barcodeUnits.filter(bu => !bu.store_product_unit_id);
    
    if (unmappedBarcodeUnits.length > 0) {
      console.log(`   ❌ Found ${unmappedBarcodeUnits.length} unmapped barcode units`);
      console.log('   💡 This is why promotions show "0 products imported"');
      console.log('   🔧 Run: ./manage.sh repair-data');
    } else {
      console.log('   ✅ All barcode units are properly mapped');
    }

    const unmappedProductUnits = storeProduct.availableUnits.filter(async (unitId) => {
      const mappedBarcodeUnit = await OdooBarcodeUnit.findOne({ store_product_unit_id: unitId });
      return !mappedBarcodeUnit;
    });
    
    if (unmappedProductUnits.length > 0) {
      console.log(`   ⚠️  Found ${unmappedProductUnits.length} store ProductUnits not mapped to Odoo`);
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await debugBritanniaMapping();
  
  console.log('\n🎉 Britannia mapping debug completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 