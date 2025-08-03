const odooService = require('./services/odooService');
const mongoose = require('mongoose');

// Test script for selective category sync
async function testSelectiveCategorySync() {
  try {
    console.log('🧪 Testing Selective Category Sync');
    console.log('=====================================\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');

    // Test connection to Odoo
    console.log('\n🔌 Testing Odoo connection...');
    const connectionTest = await odooService.testConnection();
    if (!connectionTest.success) {
      throw new Error('Odoo connection failed');
    }
    console.log('✅ Odoo connection successful');

    // Get some test categories
    console.log('\n📂 Fetching available categories...');
    const categories = await odooService.fetchCategories([], 5, 0);
    
    if (!categories || categories.length === 0) {
      throw new Error('No categories found in Odoo');
    }

    console.log(`✅ Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`   - ${cat.id}: ${cat.complete_name || cat.name}`);
    });

    // Test selective sync with first category
    const testCategoryId = categories[0].id;
    console.log(`\n🔄 Testing selective sync for category: ${testCategoryId} (${categories[0].complete_name || categories[0].name})`);

    const syncResult = await odooService.syncProductsByCategory(testCategoryId);
    
    console.log('✅ Selective category sync completed:');
    console.log(`   - Category: ${syncResult.category?.complete_name || syncResult.category?.name}`);
    console.log(`   - Total products: ${syncResult.total}`);
    console.log(`   - Synced products: ${syncResult.synced}`);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📱 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testSelectiveCategorySync();
}

module.exports = { testSelectiveCategorySync }; 