require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");

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

const testPromotionCreation = async () => {
  console.log('=== TESTING PROMOTION CREATION ===\n');

  try {
    // First, get a product unit to test with
    const ProductUnit = require("./models/ProductUnit");
    console.log('Looking for product units...');
    const productUnits = await ProductUnit.find({}).limit(1).populate('productId');
    console.log(`Found ${productUnits.length} product units`);
    
    if (productUnits.length === 0) {
      console.log('❌ No product units found in database');
      return;
    }

    const testProductUnit = productUnits[0];
    console.log('✅ Found test product unit:');
    console.log(`   ID: ${testProductUnit._id}`);
    console.log(`   Product: ${testProductUnit.productId?.title?.en || 'Unknown'}`);
    console.log(`   Price: $${testProductUnit.price}`);

    // Get a promotion list to test with
    const PromotionList = require("./models/PromotionList");
    const promotionLists = await PromotionList.find({}).limit(1);
    
    let testPromotionList = null;
    if (promotionLists.length > 0) {
      testPromotionList = promotionLists[0];
      console.log(`✅ Found test promotion list: ${testPromotionList.name} (${testPromotionList.type})`);
    }

    // Test data for promotion creation
    const promotionData = {
      name: "Test Promotion",
      description: "This is a test promotion",
      productUnit: testProductUnit._id,
      promotionList: testPromotionList ? testPromotionList._id : null,
      type: "fixed_price",
      value: 250,
      minQty: 1,
      maxQty: null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true
    };

    console.log('\n=== TESTING API CALL ===');
    console.log('Promotion data:', JSON.stringify(promotionData, null, 2));

    // Test the API call
    try {
      const response = await axios.post('http://localhost:5055/api/promotions', promotionData);
      console.log('\n✅ SUCCESS! Promotion created successfully');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('\n❌ ERROR creating promotion:');
      console.log('Status:', error.response?.status);
      console.log('Error message:', error.response?.data?.message || error.message);
      console.log('Full error data:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error in test:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

const main = async () => {
  try {
    await connectDB();
    await testPromotionCreation();
  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

main(); 