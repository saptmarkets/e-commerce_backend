require("dotenv").config();
const mongoose = require("mongoose");

const checkClusterData = async () => {
  try {
    console.log('Connecting to MongoDB cluster...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('✅ MongoDB connected successfully!');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== COLLECTIONS IN CLUSTER ===');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });

    // Check specific collections for data
    const collectionsToCheck = [
      'products', 'categories', 'orders', 'customers', 'admins', 
      'productunits', 'attributes', 'coupons', 'promotions'
    ];

    console.log('\n=== DATA COUNT IN COLLECTIONS ===');
    for (const collectionName of collectionsToCheck) {
      try {
        const count = await mongoose.connection.db.collection(collectionName).countDocuments();
        console.log(`${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`${collectionName}: Collection not found`);
      }
    }

    // Check for products specifically
    console.log('\n=== PRODUCTS DETAILS ===');
    try {
      const products = await mongoose.connection.db.collection('products').find({}).limit(3).toArray();
      console.log(`Found ${products.length} products (showing first 3):`);
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title || product.name || 'No title'} (ID: ${product._id})`);
      });
    } catch (error) {
      console.log('Products collection not found or empty');
    }

    // Check for categories specifically
    console.log('\n=== CATEGORIES DETAILS ===');
    try {
      const categories = await mongoose.connection.db.collection('categories').find({}).limit(3).toArray();
      console.log(`Found ${categories.length} categories (showing first 3):`);
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name || category.title || 'No name'} (ID: ${category._id})`);
      });
    } catch (error) {
      console.log('Categories collection not found or empty');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkClusterData(); 