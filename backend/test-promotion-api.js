// Test script to diagnose promotion API issues
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5055';

async function testPromotionAPI() {
  console.log('Testing Promotion API...');
  
  try {
    // Test the active promotions endpoint
    console.log('\n1. Testing GET /api/promotions/active');
    const activePromotionsResponse = await axios.get(`${API_URL}/api/promotions/active`);
    console.log('Status:', activePromotionsResponse.status);
    console.log('Response type:', typeof activePromotionsResponse.data);
    console.log('Is array?', Array.isArray(activePromotionsResponse.data));
    console.log('Data length:', Array.isArray(activePromotionsResponse.data) ? activePromotionsResponse.data.length : 'N/A');
    console.log('Sample data:', JSON.stringify(activePromotionsResponse.data).substring(0, 200) + '...');
    
    // Test the all promotions endpoint
    console.log('\n2. Testing GET /api/promotions');
    const allPromotionsResponse = await axios.get(`${API_URL}/api/promotions`);
    console.log('Status:', allPromotionsResponse.status);
    console.log('Response shape:', Object.keys(allPromotionsResponse.data));
    console.log('Promotions array?', Array.isArray(allPromotionsResponse.data.promotions));
    console.log('Promotions count:', allPromotionsResponse.data.promotions?.length || 0);
    
    if (allPromotionsResponse.data.promotions?.length > 0) {
      // Get details of a single promotion
      const promotionId = allPromotionsResponse.data.promotions[0]._id;
      console.log('\n3. Testing GET /api/promotions/' + promotionId);
      const singlePromotionResponse = await axios.get(`${API_URL}/api/promotions/${promotionId}`);
      console.log('Status:', singlePromotionResponse.status);
      console.log('Response type:', typeof singlePromotionResponse.data);
      console.log('Has product?', !!singlePromotionResponse.data.product);
      console.log('Sample data:', JSON.stringify(singlePromotionResponse.data).substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPromotionAPI(); 