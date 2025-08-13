require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Support a broad set of env var names for compatibility across hosts
    const uriCandidates = [
      process.env.MONGO_URI,
      process.env.MONGODB_URI,
      process.env.MONGO_URL,
      process.env.MONGODB_URL,
      process.env.DATABASE_URL,
      process.env.DB_URI,
      process.env.DB_URL,
    ].filter(Boolean);

    const mongoUri = uriCandidates[0];

    if (!mongoUri) {
      console.error(
        "❌ No MongoDB URI found! Please set one of: MONGO_URI, MONGODB_URI, MONGO_URL, MONGODB_URL, DATABASE_URL, DB_URI, DB_URL."
      );
      process.exit(1);
    }

    // Avoid printing full credentials in logs
    const sanitized = (() => {
      try {
        // Basic mask for credentials in URI
        return mongoUri.replace(/\/\/(.*)@/, "//***@");
      } catch (_) {
        return "[redacted]";
      }
    })();

    console.log("Attempting to connect to MongoDB with URI:", sanitized);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
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
