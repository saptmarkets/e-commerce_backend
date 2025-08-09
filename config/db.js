require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI for compatibility
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error("❌ No MongoDB URI found! Please set either MONGO_URI or MONGODB_URI environment variable.");
      process.exit(1);
    }
    
    console.log('Attempting to connect to MongoDB with URI:', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log("mongodb connection success!");
  } catch (err) {
    console.log("mongodb connection failed!", err.message);
    console.log("Full error:", err);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
};
