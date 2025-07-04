const mongoose = require('mongoose');
require('dotenv').config();

const resetDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      directConnection: true
    });
    console.log('Connected to MongoDB');

    // Drop the settings collection
    await mongoose.connection.db.dropCollection('settings');
    console.log('Settings collection dropped');

    // Drop the storecustomizations collection
    try {
      await mongoose.connection.db.dropCollection('storecustomizations');
      console.log('StoreCustomizations collection dropped');
    } catch (err) {
      console.log('StoreCustomizations collection not found or already dropped');
    }

    console.log('Database reset complete');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDb(); 