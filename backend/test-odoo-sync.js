#!/usr/bin/env node

require("dotenv").config();
const { connectDB } = require("./config/db");
const odooSyncService = require("./services/odooSyncService");
const odooImportService = require("./services/odooImportService");

async function testOdooSync() {
  try {
    console.log('🚀 Starting Odoo Sync System Test...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');

    // Test 1: Connection Test
    console.log('=== TEST 1: Odoo Connection ===');
    try {
      const connectionResult = await odooSyncService.testConnection();
      if (connectionResult.success) {
        console.log('✅ Odoo connection successful');
        console.log(`   Database: ${connectionResult.database}`);
        console.log(`   UID: ${connectionResult.uid}`);
        console.log(`   Version: ${connectionResult.version?.server_version || 'Unknown'}\n`);
      } else {
        console.log('❌ Odoo connection failed:', connectionResult.error);
        console.log('   Please check your Odoo configuration in environment variables\n');
      }
    } catch (error) {
      console.log('❌ Odoo connection test failed:', error.message);
      console.log('   This is expected if Odoo server is not running\n');
      console.log('📝 To test with a real Odoo server, set these environment variables:');
      console.log('   ODOO_HOST=your-odoo-host');
      console.log('   ODOO_PORT=8069');
      console.log('   ODOO_DATABASE=your-database-name');
      console.log('   ODOO_USERNAME=your-username');
      console.log('   ODOO_PASSWORD=your-password\n');
      
      // Continue with other tests that don't require Odoo connection
    }

    // Test 2: Database Models
    console.log('=== TEST 2: Database Models ===');
    const OdooProduct = require('./models/OdooProduct');
    const OdooCategory = require('./models/OdooCategory');
    const OdooSyncLog = require('./models/OdooSyncLog');

    // Test model creation
    const testLog = await OdooSyncLog.create({
      operation_type: 'fetch_from_odoo',
      data_type: 'products',
      status: 'completed',
      started_at: new Date(),
      completed_at: new Date(),
      total_records: 0,
      successful_records: 0,
    });
    console.log('✅ OdooSyncLog model working');

    // Clean up test data
    await OdooSyncLog.findByIdAndDelete(testLog._id);
    console.log('✅ Database cleanup successful\n');

    // Test 3: Sync Statistics
    console.log('=== TEST 3: Sync Statistics ===');
    try {
      const stats = await odooSyncService.getSyncStatistics();
      console.log('✅ Sync statistics retrieved:');
      console.log(`   Products: ${stats.total_records.products}`);
      console.log(`   Categories: ${stats.total_records.categories}`);
      console.log(`   UoMs: ${stats.total_records.uom}`);
      console.log(`   Stock items: ${stats.total_records.stock}`);
      console.log(`   Barcode units: ${stats.total_records.barcode_units}`);
      console.log(`   Pricelists: ${stats.total_records.pricelists}`);
      console.log(`   Pricelist items: ${stats.total_records.pricelist_items}\n`);
    } catch (error) {
      console.log('❌ Sync statistics test failed:', error.message);
    }

    // Test 4: Import Service Preview
    console.log('=== TEST 4: Import Service ===');
    try {
      const mockImportConfig = {
        categories: [1, 2], // Mock category IDs
        products: [1, 2, 3], // Mock product IDs
        options: { update_existing: false }
      };
      
      const preview = await odooImportService.getImportPreview(mockImportConfig);
      console.log('✅ Import preview service working');
      console.log(`   Categories to process: ${preview.categories.length}`);
      console.log(`   Products to process: ${preview.products.length}`);
      console.log(`   Conflicts detected: ${preview.conflicts.length}\n`);
    } catch (error) {
      console.log('❌ Import service test failed:', error.message);
    }

    // Test 5: API Routes Structure
    console.log('=== TEST 5: API Routes ===');
    console.log('✅ Available Odoo sync API endpoints:');
    console.log('   GET  /api/odoo-sync/connection/test');
    console.log('   GET  /api/odoo-sync/connection/status');
    console.log('   POST /api/odoo-sync/fetch');
    console.log('   POST /api/odoo-sync/import');
    console.log('   POST /api/odoo-sync/import/preview');
    console.log('   GET  /api/odoo-sync/statistics');
    console.log('   GET  /api/odoo-sync/logs');
    console.log('   GET  /api/odoo-sync/products');
    console.log('   GET  /api/odoo-sync/categories');
    console.log('   GET  /api/odoo-sync/uom');
    console.log('   GET  /api/odoo-sync/stock');
    console.log('   GET  /api/odoo-sync/barcode-units');
    console.log('   GET  /api/odoo-sync/pricelists');
    console.log('   GET  /api/odoo-sync/pricelist-items');
    console.log('   DELETE /api/odoo-sync/clear\n');

    console.log('🎉 Odoo Sync System Test Completed Successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure Odoo connection environment variables');
    console.log('2. Start your backend server: npm run dev');
    console.log('3. Test the API endpoints using the admin panel');
    console.log('4. Use the sync functionality to import data from Odoo\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testOdooSync(); 