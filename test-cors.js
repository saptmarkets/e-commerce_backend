const axios = require('axios');

async function testBackend() {
  console.log('🔍 Testing Backend CORS Configuration');
  console.log('=====================================');
  
  const baseUrl = 'https://e-commerce-backend-l0s0.onrender.com';
  
  // Test endpoints
  const endpoints = [
    '/api/setting/store-setting/all',
    '/api/setting/global/all',
    '/api/category/show',
    '/api/language/show',
    '/api/homepage-sections/active',
    '/api/banners/location/footer-banner'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          'Origin': 'https://e-commerce-customer-three.vercel.app',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`✅ Success: ${response.status} - ${response.statusText}`);
      console.log(`📋 CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Methods: ${response.headers['access-control-allow-methods']}`);
      console.log(`   Access-Control-Allow-Headers: ${response.headers['access-control-allow-headers']}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Headers:`, error.response.headers);
      }
    }
  }
}

testBackend(); 