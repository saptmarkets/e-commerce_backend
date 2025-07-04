/**
 * Check current status of specific pricelist items
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

// Check item status
const checkItemStatus = async () => {
  console.log('\n🔍 Checking status of items 23 and 24...\n');

  try {
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    
    for (const itemId of [23, 24]) {
      const item = await OdooPricelistItem.findOne({ id: itemId });
      
      if (item) {
        console.log(`📋 Item ${itemId}:`);
        console.log(`   - Fixed Price: ${item.fixed_price}`);
        console.log(`   - Barcode Unit ID: ${item.barcode_unit_id || 'None'}`);
        console.log(`   - Store Promotion ID: ${item.store_promotion_id || 'Not set'}`);
        console.log(`   - Sync Status: ${item._sync_status || 'pending'}`);
        console.log(`   - Compute Price: ${item.compute_price}`);
        console.log(`   - Active: ${item.active}`);
        
        // Check if it would be skipped by import logic
        if (item.store_promotion_id) {
          console.log(`   ❌ Would be skipped: Already has store_promotion_id`);
        } else if (item.date_end && item.date_end < new Date()) {
          console.log(`   ❌ Would be skipped: Expired (end date: ${item.date_end})`);
        } else if (!item.active) {
          console.log(`   ❌ Would be skipped: Not active`);
        } else if (item.compute_price !== 'fixed') {
          console.log(`   ❌ Would be skipped: Not fixed price (${item.compute_price})`);
        } else {
          console.log(`   ✅ Would be imported: All conditions met`);
        }
        
        console.log('');
      } else {
        console.log(`❌ Item ${itemId} not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkItemStatus();
  
  console.log('\n🎉 Status check completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 