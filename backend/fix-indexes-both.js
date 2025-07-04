const mongoose = require('mongoose');

async function fixIndexesBoth() {
  try {
    // Use the exact connection string from your .env file
    const connectionString = 'mongodb://127.0.0.1:27017/saptmarkets?authSource=admin';
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('productunits');

    // List current indexes
    console.log('\n📋 CURRENT INDEXES:');
    const currentIndexes = await collection.indexes();
    currentIndexes.forEach(index => {
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Create indexes for both field name formats
    console.log('\n🔧 CREATING INDEXES FOR BOTH FORMATS:');
    
    const indexesToCreate = [
      // Original format (for backward compatibility)
      { index: { productId: 1, unitId: 1, unitValue: 1 }, name: 'productId_1_unitId_1_unitValue_1' },
      { index: { productId: 1, isActive: 1 }, name: 'productId_1_isActive_1' },
      
      // New format (current model)
      { index: { product: 1, unit: 1, unitValue: 1 }, name: 'product_1_unit_1_unitValue_1' },
      { index: { product: 1, isActive: 1 }, name: 'product_1_isActive_1' },
      
      // Other indexes
      { index: { sku: 1 }, name: 'sku_1', options: { sparse: true } },
      { index: { barcode: 1 }, name: 'barcode_1', options: { unique: true, sparse: true } },
      { index: { isActive: 1, isAvailable: 1 }, name: 'isActive_1_isAvailable_1' }
    ];

    for (const { index, name, options = {} } of indexesToCreate) {
      try {
        await collection.createIndex(index, { name, ...options });
        console.log(`✅ Created: ${name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Index ${name} already exists`);
        } else {
          console.log(`⚠️  Error creating ${name}: ${error.message}`);
        }
      }
    }

    // Verify final indexes
    console.log('\n📋 FINAL INDEXES:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 SUCCESS! Database indexes support both field formats.');
    console.log('🎯 System now supports both productId/unitId and product/unit fields.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixIndexesBoth(); 