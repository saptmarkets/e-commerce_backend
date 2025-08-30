const https = require('https');
const http = require('http');

console.log('🧪 Testing Odoo Integration with Cloud Server...\n');

// Configuration - Update these with your actual cloud server details
const CLOUD_SERVER_URL = process.env.CLOUD_SERVER_URL || 'https://your-cloud-server.com';
const API_TOKEN = process.env.API_TOKEN || 'your-api-token-here';

// Test endpoints
const endpoints = [
  '/api/health',
  '/api/odoo-integration/test-connection',
  '/api/odoo-integration/statistics',
  '/api/odoo-integration/pending-orders',
  '/api/odoo-integration/sessions'
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        ...options.headers
      },
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: response,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            headers: res.headers,
            raw: true
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(endpoint) {
  const url = `${CLOUD_SERVER_URL}${endpoint}`;
  console.log(`🔍 Testing: ${endpoint}`);
  
  try {
    const response = await makeRequest(url);
    
    console.log(`✅ Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      if (response.raw) {
        console.log(`   Response: ${response.data.substring(0, 100)}...`);
      } else {
        console.log(`   Success: ${response.data.success || 'N/A'}`);
        if (response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
      }
    } else if (response.statusCode === 401) {
      console.log(`   ⚠️ Authentication required - Check API token`);
    } else if (response.statusCode === 404) {
      console.log(`   ❌ Endpoint not found - Check server configuration`);
    } else {
      console.log(`   ❌ Error: ${response.data.message || response.data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function testProcessOrders() {
  console.log('🔍 Testing: Process Orders (POST)');
  
  try {
    const response = await makeRequest(`${CLOUD_SERVER_URL}/api/odoo-integration/process-orders`, {
      method: 'POST',
      body: JSON.stringify({
        targetDate: '2024-01-01',
        adminId: 'test-admin'
      })
    });
    
    console.log(`✅ Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   Success: ${response.data.success}`);
      if (response.data.sessionId) {
        console.log(`   Session ID: ${response.data.sessionId}`);
      }
    } else if (response.statusCode === 400) {
      console.log(`   ⚠️ Bad Request: ${response.data.error || 'Validation error'}`);
    } else {
      console.log(`   ❌ Error: ${response.data.message || response.data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function runTests() {
  console.log('🚀 Starting cloud server tests...\n');
  console.log(`📍 Server: ${CLOUD_SERVER_URL}`);
  console.log(`🔑 Token: ${API_TOKEN ? 'Set' : 'Not set'}\n`);
  
  // Test basic endpoints
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  // Test POST endpoint
  await testProcessOrders();
  
  console.log('🎉 Cloud server tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Health endpoint: Should return 200');
  console.log('- Odoo endpoints: May return 401 (auth required) or 500 (not configured)');
  console.log('- This is expected if Odoo credentials are not set up on the server');
  console.log('\n💡 Next steps:');
  console.log('1. Update CLOUD_SERVER_URL and API_TOKEN environment variables');
  console.log('2. Configure Odoo credentials on your cloud server');
  console.log('3. Access the admin interface at: /odoo-integration');
}

// Check if environment variables are set
if (!process.env.CLOUD_SERVER_URL) {
  console.log('⚠️ CLOUD_SERVER_URL not set. Using default.');
  console.log('💡 Set CLOUD_SERVER_URL environment variable to your actual cloud server URL');
}

if (!process.env.API_TOKEN) {
  console.log('⚠️ API_TOKEN not set. Using default.');
  console.log('💡 Set API_TOKEN environment variable to your actual API token');
}

console.log('');

runTests().catch(console.error);
