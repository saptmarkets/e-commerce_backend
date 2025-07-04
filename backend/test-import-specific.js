/**
 * Test import for specific items
 */

const mongoose = require('mongoose');
const OdooImportService = require('./services/odooImportService');

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

// Test import
const testImport = async () => {
  console.log('\n🧪 Testing import for Britannia product items (23, 24)...\n');

  try {
    const result = await OdooImportService.importPromotions([23, 24]);
    
    console.log('🎉 Import result:');
    console.log(`   - Imported: ${result.imported}`);
    console.log(`   - Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ No errors! Import successful!');
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testImport();
  
  console.log('\n🎉 Test completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 