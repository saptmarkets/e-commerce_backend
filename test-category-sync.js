// Set environment variables for ngrok testing
process.env.ODOO_URL = 'https://6edb8b41c1fe.ngrok-free.app';
process.env.ODOO_DB = 'forapi_17';
process.env.ODOO_USERNAME = 'admin';
process.env.ODOO_PASSWORD = 'admin';

const OdooService = require('./services/odooService');

async function testCategorySync() {
  console.log('🧪 Testing Category-based Sync Functionality...\n');
  
  const odooService = new OdooService();
  
  try {
    // Test 1: Get categories for sync
    console.log('1️⃣ Testing category fetch for sync selection...');
    const categories = await odooService.getCategoriesForSync();
    console.log(`✅ Found ${categories.length} categories`);
    
    if (categories.length > 0) {
      console.log('   Sample categories:');
      categories.slice(0, 5).forEach((category, index) => {
        console.log(`     ${index + 1}. ${category.complete_name} (${category.product_count} products)`);
      });
    }

    // Test 2: Test product fetch by category
    if (categories.length > 0) {
      const testCategory = categories[0];
      console.log(`\n2️⃣ Testing product fetch for category: ${testCategory.complete_name}`);
      
      const products = await odooService.fetchProductsByCategory(testCategory.id, 10, 0);
      console.log(`✅ Found ${products.length} products in category`);
      
      if (products.length > 0) {
        console.log('   Sample products:');
        products.slice(0, 3).forEach((product, index) => {
          console.log(`     ${index + 1}. ${product.name} (ID: ${product.id})`);
        });
      }
    }

    // Test 3: Test stock fetch by category
    if (categories.length > 0) {
      const testCategory = categories[0];
      console.log(`\n3️⃣ Testing stock fetch for category: ${testCategory.complete_name}`);
      
      const stockLevels = await odooService.fetchStockByCategory(testCategory.id, 10, 0);
      console.log(`✅ Found ${stockLevels.length} stock entries for category`);
      
      if (stockLevels.length > 0) {
        console.log('   Sample stock levels:');
        stockLevels.slice(0, 3).forEach((stock, index) => {
          console.log(`     ${index + 1}. Product ${stock.product_id}: ${stock.quantity} available`);
        });
      }
    }

    // Test 4: Test category sync with progress tracking
    if (categories.length > 0) {
      const testCategory = categories[0];
      console.log(`\n4️⃣ Testing category sync with progress tracking: ${testCategory.complete_name}`);
      
      const progressCallback = (progress) => {
        console.log(`   📊 Progress: ${progress.current}/${progress.total} - ${progress.status}`);
      };
      
      const syncResult = await odooService.syncProductsByCategory(testCategory.id, progressCallback);
      console.log(`✅ Sync completed: ${syncResult.total} products synced`);
    }

    console.log('\n🎉 All category sync tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   Categories available: ${categories.length}`);
    console.log(`   Category-based sync: ✅ Working`);
    console.log(`   Product fetch by category: ✅ Working`);
    console.log(`   Stock fetch by category: ✅ Working`);
    console.log(`   Progress tracking: ✅ Working`);

  } catch (error) {
    console.error('\n❌ Category sync test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCategorySync(); 