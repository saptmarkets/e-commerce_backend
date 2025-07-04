// Script to drop the sku_1 unique index from productunits collection
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const dropSkuIndex = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await connectDB();
    
    console.log('Dropping sku_1 index from productunits collection...');
    const result = await conn.connection.db.collection('productunits').dropIndex('sku_1');
    
    console.log('Index dropped successfully:', result);
    console.log('Done!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error.message);
    
    if (error.message.includes('index not found')) {
      console.log('The index does not exist - no need to drop it.');
      process.exit(0);
    } else {
      // List all indexes for debugging
      try {
        const conn = mongoose.connection;
        const indexes = await conn.db.collection('productunits').indexes();
        console.log('Available indexes:', indexes);
      } catch (indexError) {
        console.error('Error listing indexes:', indexError.message);
      }
      
      process.exit(1);
    }
  }
};

// Run the script
dropSkuIndex(); 