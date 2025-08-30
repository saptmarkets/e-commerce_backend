const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function to add odooSync fields to existing orders
const migrateOrdersForOdooSync = async () => {
  try {
    console.log('🚀 Starting migration: Adding odooSync fields to existing orders...');
    
    const Order = require('../models/Order');
    
    // Find all orders that don't have odooSync field
    const ordersToUpdate = await Order.find({
      $or: [
        { odooSync: { $exists: false } },
        { odooSync: null }
      ]
    });
    
    console.log(`📊 Found ${ordersToUpdate.length} orders to update`);
    
    if (ordersToUpdate.length === 0) {
      console.log('✅ No orders need migration - all orders already have odooSync fields');
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Update orders in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < ordersToUpdate.length; i += batchSize) {
      const batch = ordersToUpdate.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ordersToUpdate.length / batchSize)}`);
      
      for (const order of batch) {
        try {
          // Add odooSync field with default values
          await Order.findByIdAndUpdate(order._id, {
            $set: {
              'odooSync.status': null,
              'odooSync.attempts': 0
            }
          }, { new: true });
          
          updatedCount++;
          
          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount} orders so far...`);
          }
          
        } catch (error) {
          console.error(`❌ Error updating order ${order._id}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n📋 Migration Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} orders`);
    console.log(`❌ Errors: ${errorCount} orders`);
    console.log(`📊 Total processed: ${ordersToUpdate.length} orders`);
    
    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Main execution
const runMigration = async () => {
  try {
    await connectDB();
    await migrateOrdersForOdooSync();
    console.log('✅ Migration process completed');
  } catch (error) {
    console.error('❌ Migration process failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateOrdersForOdooSync };
