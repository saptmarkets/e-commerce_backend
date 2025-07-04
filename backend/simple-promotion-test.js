const axios = require("axios");

const testPromotionCreation = async () => {
  console.log('=== SIMPLE PROMOTION CREATION TEST ===\n');

  // Use a known product unit ID from the previous unit migration
  const knownProductUnitId = "6846252c37a9b30a7c83ac52"; // This was in the console logs

  const promotionData = {
    name: "Test Fixed Price Promotion",
    description: "Testing the fixed promotion creation",
    productUnit: knownProductUnitId,
    type: "fixed_price",
    value: 250,
    minQty: 1,
    maxQty: null,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  };

  console.log('Testing promotion creation with data:');
  console.log(JSON.stringify(promotionData, null, 2));

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
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on http://localhost:5055');
    }
  }
};

testPromotionCreation(); 