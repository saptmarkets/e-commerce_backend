/**
 * Check pricelist items for Britannia product
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

// Check pricelist items
const checkPricelistItems = async () => {
  console.log('\n🔍 Checking pricelist items for Britannia product (ID: 4829)...\n');

  try {
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const Promotion = require('./models/Promotion');
    
    // Find all pricelist items for this product
    const items = await OdooPricelistItem.find({ 
      product_id: 4829,
      compute_price: 'fixed'
    });
    
    console.log(`💰 Found ${items.length} pricelist items:`);
    
    for (const item of items) {
      console.log(`\n📋 Item ID: ${item.id}`);
      console.log(`   - Fixed Price: ${item.fixed_price}`);
      console.log(`   - Barcode Unit ID: ${item.barcode_unit_id || 'None'}`);
      console.log(`   - Store Promotion ID: ${item.store_promotion_id || 'Not set'}`);
      console.log(`   - Sync Status: ${item._sync_status || 'pending'}`);
      
      if (item._import_error) {
        console.log(`   - Import Error: ${item._import_error}`);
      }
      
      // Check if the store_promotion_id is valid
      if (item.store_promotion_id) {
        const promotion = await Promotion.findById(item.store_promotion_id);
        if (promotion) {
          console.log(`   ✅ Promotion exists: ${promotion.name?.en || 'N/A'}`);
        } else {
          console.log(`   ❌ Promotion not found! This might be the issue.`);
          console.log(`   💡 The store_promotion_id points to: ${item.store_promotion_id}`);
        }
      }
    }
    
    // Also check for any pricelist items with barcode_unit_id 7383 (CTN 12)
    console.log('\n🔍 Checking for pricelist items with barcode_unit_id 7383 (CTN 12):');
    const ctn12Items = await OdooPricelistItem.find({ 
      barcode_unit_id: 7383,
      compute_price: 'fixed'
    });
    
    console.log(`💰 Found ${ctn12Items.length} pricelist items for CTN 12:`);
    for (const item of ctn12Items) {
      console.log(`   - Item ID: ${item.id}, Product ID: ${item.product_id}, Price: ${item.fixed_price}`);
      console.log(`     Store Promotion ID: ${item.store_promotion_id || 'Not set'}`);
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkPricelistItems();
  
  console.log('\n🎉 Pricelist items check completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 