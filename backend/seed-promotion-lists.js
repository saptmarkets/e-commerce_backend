require("dotenv").config();
const mongoose = require("mongoose");
const PromotionList = require("./models/PromotionList");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully!');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

const promotionLists = [
  {
    name: 'Fixed Price Offers',
    description: 'Set a specific fixed price for individual products (e.g., Product X for $15)',
    type: 'fixed_price',
    isActive: true,
    defaultValue: 0,
    priority: 1
  },
  {
    name: 'Bulk Purchase Offers', 
    description: 'Buy X quantity and get Y quantity free (e.g., Buy 200 get 50 free)',
    type: 'bulk_purchase',
    isActive: true,
    defaultValue: 0,
    priority: 2
  },
  {
    name: 'Combo Deal Offers',
    description: 'Any combination of selected products for a fixed price (e.g., Any 5 items for $10.95)',
    type: 'assorted_items', 
    isActive: true,
    defaultValue: 0,
    priority: 3
  }
];

const seedPromotionLists = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing promotion lists
    await PromotionList.deleteMany({});
    console.log('Cleared existing promotion lists');

    // Insert new promotion lists
    const insertedLists = await PromotionList.insertMany(promotionLists);
    console.log(`Inserted ${insertedLists.length} promotion lists:`);
    
    insertedLists.forEach((list, index) => {
      console.log(`${index + 1}. ${list.name} (${list.type}) - Priority: ${list.priority}`);
    });

    console.log('\nPromotion lists seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding promotion lists:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seeding function
if (require.main === module) {
  seedPromotionLists();
}

module.exports = seedPromotionLists; 