/**
 * Test script to verify mobile delivery API endpoints
 * Run this to check if the backend is properly updated and running
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5055/api';

async function testMobileDeliveryAPI() {
  console.log('🧪 Testing Mobile Delivery API');
  console.log('📍 Base URL:', BASE_URL);
  
  try {
    // 1. Test Health Check
    console.log('\n🏥 Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/mobile-delivery/health`);
    console.log('✅ Health Check:', healthResponse.data);
    
    // 2. Test if routes are properly loaded
    console.log('\n🔍 Testing Route Structure...');
    
    // Test a protected route without auth (should get 401)
    try {
      await axios.get(`${BASE_URL}/mobile-delivery/orders`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Protected routes working (401 as expected)');
      } else {
        console.log('❌ Unexpected route error:', error.response?.status);
      }
    }
    
    // 3. Test server logs for mobileToggleProduct function
    console.log('\n📋 Function Availability Check...');
    
    // Make a request to a non-existent order to see if our function is loaded
    try {
      await axios.post(`${BASE_URL}/mobile-delivery/orders/test123/toggle-product`, {
        productId: 'test',
        collected: true
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ mobileToggleProduct function is loaded (401 auth error as expected)');
      } else if (error.response?.status === 404) {
        console.log('❌ Route not found - backend may not be updated');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('1. Make sure your backend server is running: npm start or node start-server.js');
    console.log('2. Check if the mobile app is connecting to the right IP address');
    console.log('3. Verify the auth token is being sent correctly');
    console.log('4. Check the backend console logs for any errors');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    console.log('\n🚨 Possible Issues:');
    console.log('- Backend server is not running');
    console.log('- Backend is running on a different port');
    console.log('- Network connection issues');
  }
}

// Run the test
testMobileDeliveryAPI();

module.exports = { testMobileDeliveryAPI }; 