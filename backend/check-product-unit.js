require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets';
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

const checkProductUnits = async () => {
  try {
    const ProductUnit = require("./models/ProductUnit");
    
    console.log('=== CHECKING PRODUCT UNITS ===\n');
    
    // Get all product units without populate to avoid virtual field issues
    const allUnits = await ProductUnit.find({}).limit(5);
    console.log(`Found ${allUnits.length} product units in database`);
    
    if (allUnits.length === 0) {
      console.log('❌ No product units found');
      return;
    }
    
    console.log('\nFirst 5 product units:');
    allUnits.forEach((unit, index) => {
      console.log(`${index + 1}. ID: ${unit._id}`);
      console.log(`   Product ID: ${unit.productId || unit.product}`);
      console.log(`   Price: $${unit.price}`);
      console.log(`   Unit: ${unit.unitType || 'Unknown'}`);
      console.log('');
    });
    
    // Test with the first valid unit
    if (allUnits.length > 0) {
      const testUnit = allUnits[0];
      console.log(`✅ Using unit ${testUnit._id} for testing`);
      
      // Now test the promotion creation
      const axios = require("axios");
      
      const promotionData = {
        name: "Test Promotion",
        description: "Testing promotion creation",
        productUnit: testUnit._id.toString(),
        type: "fixed_price",
        value: 250,
        minQty: 1,
        maxQty: null,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      };
      
      console.log('\n=== TESTING PROMOTION CREATION ===');
      console.log('Promotion data:', JSON.stringify(promotionData, null, 2));
      
      try {
        const response = await axios.post('http://localhost:5055/api/promotions', promotionData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('\n✅ SUCCESS! Promotion created successfully');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
      } catch (error) {
        console.log('\n❌ ERROR creating promotion:');
        console.log('Status:', error.response?.status);
        console.log('Error message:', error.response?.data?.message || error.message);
        console.log('Full error data:', JSON.stringify(error.response?.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkProductUnits();
  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
  process.exit(0);
};

main(); 