// Set environment variables for testing
process.env.ODOO_HOST = '127.0.0.1';
process.env.ODOO_PORT = '8069';
process.env.ODOO_DATABASE = 'forapi_17';
process.env.ODOO_USERNAME = 'admin';
process.env.ODOO_PASSWORD = 'admin';

const odooService = require('../services/odooService');

async function simpleTest() {
  try {
    console.log('🧪 Simple Odoo connection test...');
    console.log('🌐 Trying to connect to:', process.env.ODOO_HOST + ':' + process.env.ODOO_PORT);
    
    // Test connection
    const connectionStatus = odooService.getConnectionStatus();
    console.log('📡 Connection Status:', connectionStatus);
    
    if (!connectionStatus.connected) {
      console.log('❌ Not connected to Odoo. Trying to authenticate...');
      
      // Try to authenticate
      await odooService.authenticate();
      
      const newStatus = odooService.getConnectionStatus();
      console.log('📡 New Connection Status:', newStatus);
    }
    
    // Test a simple search
    console.log('\n🔍 Testing simple search...');
    const categories = await odooService.searchRead(
      'product.category',
      [],
      ['id', 'name'],
      0,
      2
    );
    
    console.log('✅ Categories found:', categories);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative connection methods
    console.log('\n🔄 Trying alternative connection methods...');
    
    // Method 1: Try with explicit IP
    try {
      console.log('🌐 Trying 127.0.0.1:8069...');
      process.env.ODOO_HOST = '127.0.0.1';
      const odooService2 = require('../services/odooService');
      await odooService2.authenticate();
      console.log('✅ Success with 127.0.0.1!');
    } catch (error2) {
      console.log('❌ Failed with 127.0.0.1:', error2.message);
    }
    
    // Method 2: Try with localhost
    try {
      console.log('🌐 Trying localhost:8069...');
      process.env.ODOO_HOST = 'localhost';
      const odooService3 = require('../services/odooService');
      await odooService3.authenticate();
      console.log('✅ Success with localhost!');
    } catch (error3) {
      console.log('❌ Failed with localhost:', error3.message);
    }
  }
}

simpleTest(); 