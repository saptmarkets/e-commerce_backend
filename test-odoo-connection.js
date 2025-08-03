const OdooService = require('./services/odooService');

async function testOdooConnection() {
  console.log('🧪 Testing Odoo Connection...\n');
  
  const odooService = new OdooService();
  
  try {
    // Test authentication
    console.log('🔐 Testing authentication...');
    const authResult = await odooService.authenticate();
    console.log('✅ Authentication successful:', authResult);
    
    // Test server info
    console.log('\n📊 Getting server info...');
    const serverInfo = await odooService.getServerInfo();
    console.log('✅ Server info:', serverInfo);
    
    // Test connection
    console.log('\n🔗 Testing connection...');
    const connectionResult = await odooService.testConnection();
    console.log('✅ Connection test:', connectionResult);
    
    // Test basic data fetch
    console.log('\n📦 Testing product fetch...');
    const products = await odooService.fetchProducts([], 5, 0);
    console.log(`✅ Found ${products.length} products`);
    
    console.log('\n🎉 All tests passed! Odoo integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Odoo connection test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide helpful debugging info
    console.log('\n🔍 Debugging Information:');
    console.log('Current configuration:');
    console.log('- Base URL:', odooService.baseUrl);
    console.log('- Database:', odooService.database);
    console.log('- Username:', odooService.username);
    console.log('- Password:', odooService.password ? '***' : 'Not set');
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if Odoo is running');
    console.log('2. Verify ngrok tunnel is active (if using remote)');
    console.log('3. Check environment variables');
    console.log('4. Verify Odoo credentials');
    console.log('5. Check firewall settings');
  }
}

// Run the test
testOdooConnection(); 