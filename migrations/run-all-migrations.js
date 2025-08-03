const mongoose = require('mongoose');
const createBasicUnits = require('./create-basic-units');
const createMissingProductUnits = require('./create-missing-product-units');

const runAllMigrations = async () => {
  console.log('🚀 Starting complete database migration...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔗 Connected to MongoDB\n');
    
    // Step 1: Create basic units
    console.log('=== STEP 1: Creating Basic Units ===');
    await createBasicUnits();
    console.log('\n');
    
    // Step 2: Create missing product units
    console.log('=== STEP 2: Creating Missing Product Units ===');
    await createMissingProductUnits();
    console.log('\n');
    
    console.log('🎉 All migrations completed successfully!');
    console.log('\n📋 What was done:');
    console.log('   ✅ Ensured all basic units exist (pcs, kg, g, l, ml, etc.)');
    console.log('   ✅ Created ProductUnit records for all products');
    console.log('   ✅ Set proper basic units for all products');
    console.log('   ✅ Updated product hasMultiUnits flags');
    console.log('\n🚀 Your system is now ready for promotions and multi-unit support!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// If this file is run directly
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = runAllMigrations; 