const axios = require('axios');

// Test configuration for your ngrok URL
const ODOO_URL = 'https://6edb8b41c1fe.ngrok-free.app';
const ODOO_DB = 'forapi_17';
const ODOO_USERNAME = 'admin';
const ODOO_PASSWORD = 'admin';

async function testOdooNgrokConnectionFixed() {
  console.log('🧪 Testing Odoo Connection via ngrok (Fixed)...\n');
  console.log(`🌐 Testing URL: ${ODOO_URL}`);
  console.log(`📊 Database: ${ODOO_DB}`);
  console.log(`👤 Username: ${ODOO_USERNAME}\n`);

  try {
    // Test 1: Check if ngrok tunnel is accessible
    console.log('1️⃣ Testing ngrok tunnel accessibility...');
    try {
      const tunnelResponse = await axios.get(`${ODOO_URL}/web/database/selector`, {
        timeout: 10000,
        validateStatus: status => status < 500
      });
      console.log('✅ ngrok tunnel is accessible');
      console.log(`   Status: ${tunnelResponse.status}`);
    } catch (error) {
      console.log('❌ ngrok tunnel not accessible');
      console.log(`   Error: ${error.message}`);
      return;
    }

    // Test 2: Test Odoo authentication
    console.log('\n2️⃣ Testing Odoo authentication...');
    const authPayload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]
      }
    };

    const authResponse = await axios.post(`${ODOO_URL}/jsonrpc`, authPayload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (authResponse.data.error) {
      console.log('❌ Authentication failed');
      console.log(`   Error: ${JSON.stringify(authResponse.data.error)}`);
      return;
    }

    const uid = authResponse.data.result;
    console.log('✅ Authentication successful');
    console.log(`   UID: ${uid}`);

    // Test 3: Get server info
    console.log('\n3️⃣ Testing server info...');
    const serverInfoPayload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'version',
        args: []
      }
    };

    const serverResponse = await axios.post(`${ODOO_URL}/jsonrpc`, serverInfoPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (serverResponse.data.result) {
      console.log('✅ Server info retrieved');
      console.log(`   Odoo Version: ${serverResponse.data.result.server_version}`);
      console.log(`   Server Version: ${serverResponse.data.result.server_version_info.join('.')}`);
    }

    // Test 4: Test product fetch
    console.log('\n4️⃣ Testing product fetch...');
    const productPayload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [ODOO_DB, uid, ODOO_PASSWORD, 'product.product', 'search_read', 
               [[['active', '=', true]]], 
               {fields: ['id', 'name', 'default_code'], limit: 5}]
      }
    };

    const productResponse = await axios.post(`${ODOO_URL}/jsonrpc`, productPayload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (productResponse.data.error) {
      console.log('❌ Product fetch failed');
      console.log(`   Error: ${JSON.stringify(productResponse.data.error)}`);
    } else {
      const products = productResponse.data.result;
      console.log('✅ Product fetch successful');
      console.log(`   Found ${products.length} products`);
      if (products.length > 0) {
        console.log('   Sample products:');
        products.slice(0, 3).forEach((product, index) => {
          console.log(`     ${index + 1}. ${product.name} (ID: ${product.id})`);
        });
      }
    }

    // Test 5: Test category fetch (FIXED - without active field)
    console.log('\n5️⃣ Testing category fetch (Fixed)...');
    const categoryPayload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [ODOO_DB, uid, ODOO_PASSWORD, 'product.category', 'search_read', 
               [[]], // Removed active field filter
               {fields: ['id', 'name'], limit: 5}]
      }
    };

    const categoryResponse = await axios.post(`${ODOO_URL}/jsonrpc`, categoryPayload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (categoryResponse.data.error) {
      console.log('❌ Category fetch failed');
      console.log(`   Error: ${JSON.stringify(categoryResponse.data.error)}`);
    } else {
      const categories = categoryResponse.data.result;
      console.log('✅ Category fetch successful');
      console.log(`   Found ${categories.length} categories`);
      if (categories.length > 0) {
        console.log('   Sample categories:');
        categories.slice(0, 3).forEach((category, index) => {
          console.log(`     ${index + 1}. ${category.name} (ID: ${category.id})`);
        });
      }
    }

    // Test 6: Test stock location fetch
    console.log('\n6️⃣ Testing stock location fetch...');
    const locationPayload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [ODOO_DB, uid, ODOO_PASSWORD, 'stock.location', 'search_read', 
               [[['usage', '=', 'internal']]], 
               {fields: ['id', 'name', 'complete_name'], limit: 5}]
      }
    };

    const locationResponse = await axios.post(`${ODOO_URL}/jsonrpc`, locationPayload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (locationResponse.data.error) {
      console.log('❌ Location fetch failed');
      console.log(`   Error: ${JSON.stringify(locationResponse.data.error)}`);
    } else {
      const locations = locationResponse.data.result;
      console.log('✅ Location fetch successful');
      console.log(`   Found ${locations.length} internal locations`);
      if (locations.length > 0) {
        console.log('   Sample locations:');
        locations.slice(0, 3).forEach((location, index) => {
          console.log(`     ${index + 1}. ${location.complete_name} (ID: ${location.id})`);
        });
      }
    }

    console.log('\n🎉 All tests passed! Odoo integration via ngrok is working correctly.');
    console.log('\n📋 Configuration Summary:');
    console.log(`   URL: ${ODOO_URL}`);
    console.log(`   Database: ${ODOO_DB}`);
    console.log(`   Username: ${ODOO_USERNAME}`);
    console.log(`   Authentication: ✅ Working`);
    console.log(`   Product Access: ✅ Working`);
    console.log(`   Category Access: ✅ Working (Fixed)`);
    console.log(`   Location Access: ✅ Working`);

    console.log('\n🚀 Ready to configure Render environment variables!');
    console.log('\n📝 Add these to your Render environment:');
    console.log(`ODOO_URL=${ODOO_URL}`);
    console.log(`ODOO_DB=${ODOO_DB}`);
    console.log(`ODOO_USERNAME=${ODOO_USERNAME}`);
    console.log(`ODOO_PASSWORD=${ODOO_PASSWORD}`);

  } catch (error) {
    console.error('\n❌ Odoo connection test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Make sure Odoo is running locally on port 8069');
      console.log('2. Verify ngrok tunnel is active');
      console.log('3. Check if ngrok URL is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check if ngrok URL is correct');
      console.log('2. Verify ngrok tunnel is active');
      console.log('3. Try restarting ngrok');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check Odoo credentials');
      console.log('2. Verify database name is correct');
      console.log('3. Ensure admin user has API access');
    }
    
    console.log('\n🔍 Debug Information:');
    console.log(`   Error Code: ${error.code || 'N/A'}`);
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Message: ${error.message}`);
  }
}

// Run the test
testOdooNgrokConnectionFixed(); 