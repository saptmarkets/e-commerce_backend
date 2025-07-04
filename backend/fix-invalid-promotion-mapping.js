/**
 * Fix invalid promotion mappings
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

// Fix invalid promotion mappings
const fixInvalidMappings = async () => {
  console.log('\n🔧 Fixing invalid promotion mappings...\n');

  try {
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const Promotion = require('./models/Promotion');
    
    // Find all pricelist items with store_promotion_id
    const itemsWithPromotionId = await OdooPricelistItem.find({
      store_promotion_id: { $exists: true, $ne: null }
    });
    
    console.log(`📋 Found ${itemsWithPromotionId.length} pricelist items with store_promotion_id`);
    
    let fixedCount = 0;
    
    for (const item of itemsWithPromotionId) {
      // Check if the promotion actually exists
      const promotion = await Promotion.findById(item.store_promotion_id);
      
      if (!promotion) {
        console.log(`❌ Item ${item.id}: Invalid promotion ID ${item.store_promotion_id}`);
        console.log(`   - Product ID: ${item.product_id}`);
        console.log(`   - Barcode Unit ID: ${item.barcode_unit_id || 'None'}`);
        console.log(`   - Fixed Price: ${item.fixed_price}`);
        
        // Clear the invalid mapping
        await OdooPricelistItem.updateOne(
          { id: item.id },
          { 
            $unset: { store_promotion_id: 1 }, 
            $set: { 
              _sync_status: 'pending',
              _import_error: null 
            } 
          }
        );
        
        console.log(`   ✅ Fixed: Cleared invalid store_promotion_id`);
        fixedCount++;
      } else {
        console.log(`✅ Item ${item.id}: Valid promotion ${item.store_promotion_id}`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} invalid mappings!`);
    
    if (fixedCount > 0) {
      console.log('\n💡 Now you can try importing promotions again.');
      console.log('   The import should work for the items that were fixed.');
    }

  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixInvalidMappings();
  
  console.log('\n🎉 Fix completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 