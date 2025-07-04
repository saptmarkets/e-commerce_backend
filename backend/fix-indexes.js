require('dotenv').config();
const mongoose = require('mongoose');
const ProductUnit = require('./models/ProductUnit');

async function fixProductUnitIndexes() {
  try {
    // Try different connection strings
    const connectionString = process.env.MONGO_URI || 
                           process.env.DB_URL || 
                           'mongodb://localhost:27017/saptmarkets';
    
    console.log(`Attempting to connect to: ${connectionString}`);
    
    // Connect to MongoDB
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('productunits');

    // List current indexes
    console.log('\n=== CURRENT INDEXES ===');
    const currentIndexes = await collection.indexes();
    currentIndexes.forEach(index => {
      console.log(`Index: ${index.name}`, index.key);
    });

    // Drop the problematic index if it exists
    const problematicIndexes = [
      'productId_1_unitId_1_unitValue_1',
      'productId_1_isActive_1',
      'productId_1'
    ];

    console.log('\n=== DROPPING OLD INDEXES ===');
    for (const indexName of problematicIndexes) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`ℹ️  Index ${indexName} does not exist or already dropped`);
      }
    }

    // Recreate indexes with correct field names
    console.log('\n=== CREATING NEW INDEXES ===');
    
    try {
      // Create the main compound index
      await collection.createIndex(
        { product: 1, unit: 1, unitValue: 1 }, 
        { name: 'product_1_unit_1_unitValue_1' }
      );
      console.log('✅ Created index: product_1_unit_1_unitValue_1');
    } catch (error) {
      console.log('ℹ️  Index product_1_unit_1_unitValue_1 may already exist');
    }

    try {
      // Create other necessary indexes
      await collection.createIndex(
        { product: 1, isActive: 1 }, 
        { name: 'product_1_isActive_1' }
      );
      console.log('✅ Created index: product_1_isActive_1');
    } catch (error) {
      console.log('ℹ️  Index product_1_isActive_1 may already exist');
    }

    try {
      await collection.createIndex(
        { sku: 1 }, 
        { name: 'sku_1', sparse: true }
      );
      console.log('✅ Created index: sku_1 (sparse)');
    } catch (error) {
      console.log('ℹ️  Index sku_1 may already exist');
    }

    try {
      await collection.createIndex(
        { barcode: 1 }, 
        { name: 'barcode_1', unique: true, sparse: true }
      );
      console.log('✅ Created index: barcode_1 (unique, sparse)');
    } catch (error) {
      console.log('ℹ️  Index barcode_1 may already exist');
    }

    try {
      await collection.createIndex(
        { isActive: 1, isAvailable: 1 }, 
        { name: 'isActive_1_isAvailable_1' }
      );
      console.log('✅ Created index: isActive_1_isAvailable_1');
    } catch (error) {
      console.log('ℹ️  Index isActive_1_isAvailable_1 may already exist');
    }

    // List final indexes
    console.log('\n=== FINAL INDEXES ===');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`Index: ${index.name}`, index.key);
    });

    console.log('\n✅ Index fix completed successfully!');
    console.log('\n🎯 You can now try creating product units again.');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error.message);
    console.error('Full error:', error);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n💡 Make sure MongoDB is running and accessible.');
      console.log('💡 Check your connection string in environment variables.');
    }
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.log('Error disconnecting:', error.message);
    }
  }
}

// Run the fix if this file is executed directly
if (require.main === module) {
  fixProductUnitIndexes();
}

module.exports = fixProductUnitIndexes; 