// Migration script to remove originalPrice and discountPercent fields from ProductUnit records
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

const removeUnneededFields = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await connectDB();
    const db = conn.connection.db;
    
    console.log('Removing originalPrice and discountPercent fields from ProductUnit records...');
    const result = await db.collection('productunits').updateMany(
      {}, // Match all documents
      { 
        $unset: { 
          originalPrice: "", 
          discountPercent: "" 
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} records out of ${result.matchedCount}.`);
    console.log('Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
};

// Run the migration
removeUnneededFields(); 