const mongoose = require('mongoose');
const odooImportService = require('./services/odooImportService');

// Load environment variables
require('dotenv').config();

async function testImportFunctionality() {
  try {
    console.log('🔍 Testing Enhanced Import Functionality...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Get import preview
    console.log('\n📋 Test 1: Getting import preview...');
    try {
      const preview = await odooImportService.getImportPreview({
        productIds: [4829, 4419], // Using some product IDs from the screenshot
        categoryIds: []
      });
      console.log('✅ Preview successful:', preview);
    } catch (error) {
      console.error('❌ Preview failed:', error.message);
    }

    // Test 2: Test import with a small set
    console.log('\n📦 Test 2: Testing import with sample products...');
    try {
      const result = await odooImportService.importToStore({
        productIds: [4829], // Just one product for testing
        categoryIds: []
      });
      console.log('✅ Import successful:', result);
    } catch (error) {
      console.error('❌ Import failed:', error.message);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testImportFunctionality(); 