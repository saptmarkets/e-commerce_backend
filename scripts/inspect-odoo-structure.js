process.env.ODOO_HOST = '127.0.0.1';
process.env.ODOO_PORT = '8069';
process.env.ODOO_DATABASE = 'forapi_17';
process.env.ODOO_USERNAME = 'admin';
process.env.ODOO_PASSWORD = 'admin';

const odooService = require('../services/odooService');

/**
 * Script to inspect Odoo database structure and custom fields
 * This will help us understand the exact field mapping for barcode units
 */
async function inspectOdooStructure() {
  try {
    console.log('🔍 Starting Odoo database structure inspection...');
    
    // Test connection
    const connectionStatus = odooService.getConnectionStatus();
    console.log('📡 Connection Status:', connectionStatus);
    
    if (!connectionStatus.connected) {
      console.log('❌ Not connected to Odoo. Trying to authenticate...');
      await odooService.authenticate();
    }
    
    console.log('\n🏷️ Inspecting barcode unit model structure...');
    
    // 1. Check the barcode unit model fields
    console.log('\n📋 Getting all fields for product.barcode.unit model...');
    const barcodeUnitFields = await odooService.callOdoo('product.barcode.unit', 'fields_get', []);
    console.log('✅ Barcode unit fields:', JSON.stringify(barcodeUnitFields, null, 2));
    
    // 2. Check if there are any custom fields
    console.log('\n🔍 Checking for custom fields...');
    const customFields = Object.keys(barcodeUnitFields).filter(field => 
      field.startsWith('x_') || 
      field.startsWith('custom_') || 
      field.includes('custom') ||
      field.includes('api')
    );
    
    if (customFields.length > 0) {
      console.log('🎯 Custom fields found:', customFields);
      customFields.forEach(field => {
        console.log(`  - ${field}: ${barcodeUnitFields[field].string || barcodeUnitFields[field].type}`);
      });
    } else {
      console.log('ℹ️ No custom fields found');
    }
    
    // 3. Get a sample barcode unit to see actual data structure
    console.log('\n📦 Getting sample barcode unit data...');
    const sampleBarcodeUnits = await odooService.searchRead(
      'product.barcode.unit',
      [],
      ['id', 'name', 'product_id', 'barcode', 'price', 'quantity', 'unit', 'sequence', 'active'],
      0,
      3
    );
    
    if (sampleBarcodeUnits && sampleBarcodeUnits.length > 0) {
      console.log('✅ Sample barcode units found:');
      sampleBarcodeUnits.forEach((unit, index) => {
        console.log(`\n📦 Barcode Unit ${index + 1}:`);
        console.log(`  ID: ${unit.id}`);
        console.log(`  Name: ${unit.name}`);
        console.log(`  Product ID: ${unit.product_id}`);
        console.log(`  Barcode: ${unit.barcode}`);
        console.log(`  Price: ${unit.price}`);
        console.log(`  Quantity: ${unit.quantity}`);
        console.log(`  Unit: ${unit.unit}`);
        console.log(`  Sequence: ${unit.sequence}`);
        console.log(`  Active: ${unit.active}`);
        
        // Show all available fields
        console.log(`  All fields:`, Object.keys(unit));
      });
    } else {
      console.log('⚠️ No barcode units found in the database');
    }
    
    // 4. Check if there are any barcode units with prices
    console.log('\n💰 Checking for barcode units with prices...');
    const pricedBarcodeUnits = await odooService.searchRead(
      'product.barcode.unit',
      [['price', '>', 0]],
      ['id', 'name', 'product_id', 'barcode', 'price', 'quantity', 'unit'],
      0,
      5
    );
    
    if (pricedBarcodeUnits && pricedBarcodeUnits.length > 0) {
      console.log(`✅ Found ${pricedBarcodeUnits.length} barcode units with prices:`);
      pricedBarcodeUnits.forEach(unit => {
        console.log(`  - ${unit.name} (ID: ${unit.id}): Price ${unit.price}, Quantity ${unit.quantity}`);
      });
    } else {
      console.log('⚠️ No barcode units with prices found');
    }
    
    // 5. Check product model to see if it has barcode_unit_ids field
    console.log('\n🏷️ Checking product model for barcode_unit_ids field...');
    const productFields = await odooService.callOdoo('product.product', 'fields_get', []);
    
    if (productFields.barcode_unit_ids) {
      console.log('✅ barcode_unit_ids field found in product model');
      console.log('Field details:', JSON.stringify(productFields.barcode_unit_ids, null, 2));
    } else {
      console.log('⚠️ barcode_unit_ids field NOT found in product model');
      console.log('Available fields:', Object.keys(productFields).filter(f => f.includes('barcode')));
    }
    
    // 6. Check if there are products with barcode units
    console.log('\n🔍 Checking for products with barcode units...');
    const productsWithBarcodeUnits = await odooService.searchRead(
      'product.product',
      [['barcode_unit_ids', '!=', false]],
      ['id', 'name', 'barcode_unit_ids'],
      0,
      3
    );
    
    if (productsWithBarcodeUnits && productsWithBarcodeUnits.length > 0) {
      console.log(`✅ Found ${productsWithBarcodeUnits.length} products with barcode units:`);
      productsWithBarcodeUnits.forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.id}): ${product.barcode_unit_ids.length} barcode units`);
      });
    } else {
      console.log('⚠️ No products with barcode units found');
    }
    
    console.log('\n✅ Odoo structure inspection completed!');
    
  } catch (error) {
    console.error('❌ Error during inspection:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the inspection
if (require.main === module) {
  inspectOdooStructure()
    .then(() => {
      console.log('\n🎯 Inspection script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Inspection script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { inspectOdooStructure }; 