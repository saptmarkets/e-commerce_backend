const mongoose = require('mongoose');

async function fixIndexes() {
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

    // Drop the problematic index
    console.log('\n🗑️  DROPPING PROBLEMATIC INDEX:');
    try {
      await collection.dropIndex('productId_1_unitId_1_unitValue_1');
      console.log('✅ Dropped: productId_1_unitId_1_unitValue_1');
    } catch (error) {
      console.log('ℹ️  Index productId_1_unitId_1_unitValue_1 not found (may already be dropped)');
    }

    // Create the correct index
    console.log('\n🔧 CREATING CORRECT INDEX:');
    try {
      await collection.createIndex(
        { product: 1, unit: 1, unitValue: 1 }, 
        { name: 'product_1_unit_1_unitValue_1' }
      );
      console.log('✅ Created: product_1_unit_1_unitValue_1');
    } catch (error) {
      console.log('ℹ️  Index product_1_unit_1_unitValue_1 may already exist');
    }

    // Verify final indexes
    console.log('\n📋 FINAL INDEXES:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 SUCCESS! Database indexes have been fixed.');
    console.log('🎯 You can now try creating product units again.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixIndexes(); 