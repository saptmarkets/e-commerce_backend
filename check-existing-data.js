require("dotenv").config();
const mongoose = require("mongoose");

const checkExistingData = async () => {
  try {
    console.log('Connecting to MongoDB cluster...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('✅ MongoDB connected successfully!');

    // Check collections that exist
    const collectionsToCheck = [
      'categories', 'customers', 'banners', 'attributes', 
      'homepagesections', 'promotionlists', 'loyaltytransactions'
    ];

    console.log('\n=== EXISTING DATA IN COLLECTIONS ===');
    for (const collectionName of collectionsToCheck) {
      try {
        const count = await mongoose.connection.db.collection(collectionName).countDocuments();
        console.log(`\n${collectionName}: ${count} documents`);
        
        if (count > 0) {
          const sampleData = await mongoose.connection.db.collection(collectionName).find({}).limit(2).toArray();
          console.log(`Sample data from ${collectionName}:`);
          sampleData.forEach((item, index) => {
            console.log(`  ${index + 1}. ID: ${item._id}`);
            if (item.name) console.log(`     Name: ${item.name}`);
            if (item.title) console.log(`     Title: ${item.title}`);
            if (item.email) console.log(`     Email: ${item.email}`);
            if (item.status) console.log(`     Status: ${item.status}`);
          });
        }
      } catch (error) {
        console.log(`${collectionName}: Error - ${error.message}`);
      }
    }

    // Check if there are any products in different collections
    console.log('\n=== CHECKING FOR PRODUCTS IN DIFFERENT COLLECTIONS ===');
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of allCollections) {
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        if (count > 0) {
          console.log(`${collection.name}: ${count} documents`);
        }
      } catch (error) {
        // Ignore errors for collections we can't access
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkExistingData(); 