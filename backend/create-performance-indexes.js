const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/saptmarkets', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

const createPerformanceIndexes = async () => {
  try {
    console.log('🚀 Creating performance indexes...');

    // Product collection indexes
    const productCollection = db.collection('products');
    
    // Core product indexes
    await productCollection.createIndex({ status: 1 });
    await productCollection.createIndex({ slug: 1 }, { unique: true });
    await productCollection.createIndex({ categories: 1 });
    await productCollection.createIndex({ category: 1 });
    await productCollection.createIndex({ _id: -1 });
    
    // Search optimization indexes
    await productCollection.createIndex({ 
      "title.en": "text",
      "title.es": "text", 
      "title.fr": "text",
      "title.de": "text"
    });
    
    // Performance-critical compound indexes
    await productCollection.createIndex({ status: 1, _id: -1 });
    await productCollection.createIndex({ status: 1, sales: -1 });
    await productCollection.createIndex({ status: 1, categories: 1, _id: -1 });
    await productCollection.createIndex({ status: 1, "prices.discount": -1 });
    await productCollection.createIndex({ status: 1, isCombination: 1, "variants.discount": 1 });
    
    // Category collection indexes
    const categoryCollection = db.collection('categories');
    await categoryCollection.createIndex({ status: 1 });
    await categoryCollection.createIndex({ _id: 1 });
    
    // ProductUnit collection indexes  
    const productUnitCollection = db.collection('productunits');
    await productUnitCollection.createIndex({ product: 1 });
    await productUnitCollection.createIndex({ product: 1, isActive: 1 });
    await productUnitCollection.createIndex({ product: 1, isDefault: 1 });
    
    // Promotion collection indexes
    const promotionCollection = db.collection('promotions');
    await promotionCollection.createIndex({ isActive: 1 });
    await promotionCollection.createIndex({ startDate: 1, endDate: 1 });
    await promotionCollection.createIndex({ productUnits: 1 });
    await promotionCollection.createIndex({ isActive: 1, startDate: 1, endDate: 1 });
    
    // Order collection indexes for better analytics
    const orderCollection = db.collection('orders');
    await orderCollection.createIndex({ createdAt: -1 });
    await orderCollection.createIndex({ user: 1, createdAt: -1 });
    await orderCollection.createIndex({ status: 1 });
    
    // Settings collection indexes
    const settingCollection = db.collection('settings');
    await settingCollection.createIndex({ name: 1 }, { unique: true });

    console.log('✅ All performance indexes created successfully!');
    
    // Show existing indexes for verification
    console.log('\n📊 Existing indexes:');
    const indexes = await productCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Check if script is run directly
if (require.main === module) {
  createPerformanceIndexes();
}

module.exports = createPerformanceIndexes; 