const http = require('http');

console.log('🧪 Testing Odoo Integration API Endpoints...\n');

// Test configuration
const baseUrl = 'http://localhost:5055';
const endpoints = [
  '/api/health',
  '/api/odoo-integration/test-connection',
  '/api/odoo-integration/statistics',
  '/api/odoo-integration/pending-orders',
  '/api/odoo-integration/sessions'
];

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + endpoint;
    console.log(`🔍 Testing: ${url}`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ ${endpoint} - Status: ${res.statusCode}`);
          if (res.statusCode === 200) {
            console.log(`   Response: ${JSON.stringify(response).substring(0, 100)}...`);
          } else {
            console.log(`   Error: ${response.message || 'Unknown error'}`);
          }
        } catch (e) {
          console.log(`✅ ${endpoint} - Status: ${res.statusCode} (Raw response)`);
        }
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${endpoint} - Error: ${err.message}`);
      console.log('');
      resolve(); // Don't fail the entire test
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${endpoint} - Timeout`);
      console.log('');
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('🎉 API tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Health endpoint: Should return 200');
  console.log('- Odoo endpoints: May return 401 (auth required) or 500 (not configured)');
  console.log('- This is expected if Odoo credentials are not set up');
}

runTests().catch(console.error);
