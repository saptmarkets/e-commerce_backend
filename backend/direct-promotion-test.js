const axios = require("axios");

const testPromotionCreation = async () => {
  console.log('=== DIRECT PROMOTION CREATION TEST ===\n');

  // Use the first product unit ID from the previous output
  const productUnitId = "683e3a1e63079b046825bb14";

  const promotionData = {
    name: "Test Fixed Price Promotion",
    description: "Testing the fixed promotion creation",
    productUnit: productUnitId,
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
    console.log('\nSending request to http://localhost:5055/api/promotions...');
    
    const response = await axios.post('http://localhost:5055/api/promotions', promotionData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('\n✅ SUCCESS! Promotion created successfully');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR creating promotion:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Error message:', error.response.data?.message || 'No message');
      console.log('Full error data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received. Request was made but no response.');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
    } else {
      console.log('Error setting up request:', error.message);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on http://localhost:5055');
    }
  }
};

testPromotionCreation(); 