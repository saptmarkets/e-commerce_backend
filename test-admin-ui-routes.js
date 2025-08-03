const axios = require('axios');

// Test script to verify admin UI routes are working
async function testAdminUIRoutes() {
  const baseURL = 'http://localhost:5000/api'; // Adjust if your backend runs on different port
  
  console.log('🧪 Testing Admin UI Routes');
  console.log('===========================\n');

  try {
    // Test 1: Categories endpoint for admin UI
    console.log('📂 Test 1: GET /odoo-sync/categories');
    try {
      const categoriesRes = await axios.get(`${baseURL}/odoo-sync/categories`);
      console.log('✅ Categories endpoint working');
      console.log(`   - Status: ${categoriesRes.status}`);
      console.log(`   - Categories found: ${categoriesRes.data?.data?.categories?.length || 0}`);
    } catch (err) {
      console.log('❌ Categories endpoint failed');
      console.log(`   - Error: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`   - Message: ${err.response?.data?.message || err.message}`);
    }

    console.log('\n🔄 Test 2: POST /odoo/sync-selected-categories');
    try {
      const syncRes = await axios.post(`${baseURL}/odoo/sync-selected-categories`, {
        categoryIds: [] // Empty array for testing
      });
      console.log('✅ Selective category sync endpoint working');
      console.log(`   - Status: ${syncRes.status}`);
    } catch (err) {
      console.log('❌ Selective category sync endpoint failed');
      console.log(`   - Error: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`   - Message: ${err.response?.data?.message || err.message}`);
    }

    console.log('\n📦 Test 3: POST /odoo-sync/fetch (batch test)');
    try {
      const batchRes = await axios.post(`${baseURL}/odoo-sync/fetch`, {
        dataTypes: ['products'],
        offset: 0,
        limit: 10
      });
      console.log('✅ Batch fetch endpoint working');
      console.log(`   - Status: ${batchRes.status}`);
    } catch (err) {
      console.log('❌ Batch fetch endpoint failed');
      console.log(`   - Error: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`   - Message: ${err.response?.data?.message || err.message}`);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    console.log('\n💡 Make sure your backend server is running on the expected port');
    console.log('💡 Adjust the baseURL in this script if needed');
  }

  console.log('\n🎉 Route testing completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Fix any failing endpoints');
  console.log('2. Test the admin UI in browser');
  console.log('3. Check browser console for any errors');
}

// Run the test
if (require.main === module) {
  testAdminUIRoutes();
}

module.exports = { testAdminUIRoutes }; 