// Set environment variables for testing
process.env.ODOO_HOST = 'localhost';
process.env.ODOO_PORT = '8069';
process.env.ODOO_DATABASE = 'forapi_17';
process.env.ODOO_USERNAME = 'admin';
process.env.ODOO_PASSWORD = 'admin';

const odooService = require('../services/odooService');

/**
 * Simple test script to check Odoo connection and basic data fetching
 */
async function testOdooConnection() {
  try {
    console.log('🧪 Testing Odoo connection and basic data fetching...');
    
    // Test connection
    const connectionStatus = odooService.getConnectionStatus();
    console.log('📡 Connection Status:', connectionStatus);
    
    if (!connectionStatus.connected) {
      console.log('❌ Not connected to Odoo. Please check your connection first.');
      return;
    }
    
    console.log('✅ Connected to Odoo successfully!');
    console.log(`🌐 Host: ${connectionStatus.host}:${connectionStatus.port}`);
    console.log(`🗄️ Database: ${connectionStatus.database}`);
    console.log(`👤 User: ${connectionStatus.username}`);
    
    // Test basic data fetching
    console.log('\n🔍 Testing basic data fetching...');
    
    // 1. Test categories
    console.log('\n📂 Testing categories fetch...');
    try {
      const categories = await odooService.searchRead(
        'product.category',
        [],
        ['id', 'name', 'complete_name'],
        0,
        3
      );
      console.log(`✅ Categories fetched: ${categories.length}`);
      categories.forEach(cat => console.log(`  - ${cat.name} (ID: ${cat.id})`));
    } catch (error) {
      console.log('❌ Categories fetch failed:', error.message);
    }
    
    // 2. Test products
    console.log('\n📦 Testing products fetch...');
    try {
      const products = await odooService.searchRead(
        'product.product',
        [],
        ['id', 'name', 'default_code'],
        0,
        3
      );
      console.log(`✅ Products fetched: ${products.length}`);
      products.forEach(prod => console.log(`  - ${prod.name} (ID: ${prod.id}, Code: ${prod.default_code})`));
    } catch (error) {
      console.log('❌ Products fetch failed:', error.message);
    }
    
    // 3. Test barcode units
    console.log('\n🏷️ Testing barcode units fetch...');
    try {
      const barcodeUnits = await odooService.searchRead(
        'product.barcode.unit',
        [],
        ['id', 'name', 'product_id', 'barcode', 'price'],
        0,
        3
      );
      console.log(`✅ Barcode units fetched: ${barcodeUnits.length}`);
      if (barcodeUnits.length > 0) {
        barcodeUnits.forEach(unit => {
          console.log(`  - ${unit.name} (ID: ${unit.id}, Price: ${unit.price}, Barcode: ${unit.barcode})`);
        });
      }
    } catch (error) {
      console.log('❌ Barcode units fetch failed:', error.message);
      console.log('This might indicate the model name is different or the model doesn\'t exist');
    }
    
    // 4. Test stock
    console.log('\n📊 Testing stock fetch...');
    try {
      const stock = await odooService.searchRead(
        'stock.quant',
        [['location_id.usage', 'in', ['internal', 'transit']]],
        ['id', 'product_id', 'location_id', 'quantity'],
        0,
        3
      );
      console.log(`✅ Stock records fetched: ${stock.length}`);
      if (stock.length > 0) {
        stock.forEach(s => console.log(`  - Product: ${s.product_id}, Location: ${s.location_id}, Qty: ${s.quantity}`));
      }
    } catch (error) {
      console.log('❌ Stock fetch failed:', error.message);
    }
    
    console.log('\n✅ Basic connection test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testOdooConnection()
    .then(() => {
      console.log('\n🎯 Test script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testOdooConnection }; 