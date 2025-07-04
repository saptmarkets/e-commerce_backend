/**
 * Debug script for promotion import issues
 * This script helps identify why specific promotions aren't importing
 */

const mongoose = require('mongoose');

// Connect to MongoDB with proper options
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running on localhost:27017 or set MONGODB_URI environment variable');
    process.exit(1);
  }
};

// Debug function to analyze a specific product
const debugProduct = async (productId) => {
  console.log(`\n🔍 Debugging product: ${productId}\n`);

  try {
    // 1. Check OdooProduct
    const OdooProduct = require('./models/OdooProduct');
    const odooProduct = await OdooProduct.findOne({ product_id: parseInt(productId) });
    
    if (!odooProduct) {
      console.log('❌ Product not found in OdooProduct collection');
      return;
    }
    
    console.log('✅ Found in OdooProduct:');
    console.log(`   - Product ID: ${odooProduct.product_id}`);
    console.log(`   - Name: ${odooProduct.name?.en || 'N/A'}`);
    console.log(`   - Store Product ID: ${odooProduct.store_product_id || 'Not mapped'}`);
    console.log(`   - Barcode Unit IDs: ${odooProduct.barcode_unit_ids?.join(', ') || 'None'}`);

    // 2. Check OdooBarcodeUnit entries
    const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
    const barcodeUnits = await OdooBarcodeUnit.find({ product_id: parseInt(productId) });
    
    console.log(`\n📦 Found ${barcodeUnits.length} barcode units:`);
    for (const bu of barcodeUnits) {
      console.log(`   - ID: ${bu.id}, Name: ${bu.name}, Barcode: ${bu.barcode}`);
      console.log(`     Store Product Unit ID: ${bu.store_product_unit_id || 'Not mapped'}`);
    }

    // 3. Check OdooPricelistItem entries
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const pricelistItems = await OdooPricelistItem.find({ 
      product_id: parseInt(productId),
      compute_price: 'fixed'
    });
    
    console.log(`\n💰 Found ${pricelistItems.length} pricelist items:`);
    for (const item of pricelistItems) {
      console.log(`   - ID: ${item.id}, Fixed Price: ${item.fixed_price}`);
      console.log(`     Barcode Unit ID: ${item.barcode_unit_id || 'None'}`);
      console.log(`     Store Promotion ID: ${item.store_promotion_id || 'Not imported'}`);
      console.log(`     Sync Status: ${item._sync_status || 'pending'}`);
      if (item._import_error) {
        console.log(`     Import Error: ${item._import_error}`);
      }
    }

    // 4. Check Store Product
    if (odooProduct.store_product_id) {
      const Product = require('./models/Product');
      const storeProduct = await Product.findById(odooProduct.store_product_id);
      
      if (storeProduct) {
        console.log(`\n🏪 Store Product found:`);
        console.log(`   - ID: ${storeProduct._id}`);
        console.log(`   - Title: ${storeProduct.title?.en || 'N/A'}`);
        console.log(`   - SKU: ${storeProduct.sku}`);
        
        // 5. Check ProductUnits
        const ProductUnit = require('./models/ProductUnit');
        const productUnits = await ProductUnit.find({ product: storeProduct._id });
        
        console.log(`\n📦 Found ${productUnits.length} ProductUnits:`);
        for (const pu of productUnits) {
          console.log(`   - ID: ${pu._id}, Barcode: ${pu.barcode || 'None'}`);
          console.log(`     SKU: ${pu.sku}, Is Default: ${pu.isDefault}`);
        }
      } else {
        console.log('\n❌ Store Product not found (ID exists but document missing)');
      }
    } else {
      console.log('\n❌ Product not imported to store yet');
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
};

// Debug function to analyze a specific pricelist item
const debugPricelistItem = async (itemId) => {
  console.log(`\n🔍 Debugging pricelist item: ${itemId}\n`);

  try {
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const item = await OdooPricelistItem.findOne({ id: parseInt(itemId) });
    
    if (!item) {
      console.log('❌ Pricelist item not found');
      return;
    }
    
    console.log('✅ Found pricelist item:');
    console.log(`   - ID: ${item.id}`);
    console.log(`   - Product ID: ${item.product_id}`);
    console.log(`   - Barcode Unit ID: ${item.barcode_unit_id || 'None'}`);
    console.log(`   - Fixed Price: ${item.fixed_price}`);
    console.log(`   - Compute Price: ${item.compute_price}`);
    console.log(`   - Store Promotion ID: ${item.store_promotion_id || 'Not imported'}`);
    console.log(`   - Sync Status: ${item._sync_status || 'pending'}`);
    
    if (item._import_error) {
      console.log(`   - Import Error: ${item._import_error}`);
    }

    // Check barcode unit if exists
    if (item.barcode_unit_id) {
      const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
      const barcodeUnit = await OdooBarcodeUnit.findOne({ id: item.barcode_unit_id });
      
      if (barcodeUnit) {
        console.log(`\n📦 Barcode Unit found:`);
        console.log(`   - ID: ${barcodeUnit.id}`);
        console.log(`   - Name: ${barcodeUnit.name}`);
        console.log(`   - Barcode: ${barcodeUnit.barcode}`);
        console.log(`   - Store Product Unit ID: ${barcodeUnit.store_product_unit_id || 'Not mapped'}`);
      } else {
        console.log(`\n❌ Barcode Unit ${item.barcode_unit_id} not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node debug-promotion-import.js product <product_id>');
    console.log('  node debug-promotion-import.js item <item_id>');
    console.log('');
    console.log('Examples:');
    console.log('  node debug-promotion-import.js product 456');
    console.log('  node debug-promotion-import.js item 123');
    process.exit(0);
  }
  
  const command = args[0];
  const id = args[1];
  
  if (!id) {
    console.log('❌ Please provide an ID');
    process.exit(1);
  }
  
  if (command === 'product') {
    await debugProduct(id);
  } else if (command === 'item') {
    await debugPricelistItem(id);
  } else {
    console.log('❌ Unknown command. Use "product" or "item"');
    process.exit(1);
  }
  
  console.log('\n🎉 Debug completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 