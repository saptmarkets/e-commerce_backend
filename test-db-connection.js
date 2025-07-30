const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/?retryWrites=true&w=majority&appName=saptmarkets';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    console.log(`Database name: ${db.databaseName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check specific collections
    const collectionsToCheck = ['products', 'categories', 'promotions', 'orders', 'admins'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`\n${collectionName}: ${count} documents`);
        
        if (count > 0) {
          // Show first document structure
          const firstDoc = await db.collection(collectionName).findOne();
          console.log(`First ${collectionName} document:`, JSON.stringify(firstDoc, null, 2).substring(0, 200) + '...');
        }
      } catch (error) {
        console.log(`${collectionName}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection(); 