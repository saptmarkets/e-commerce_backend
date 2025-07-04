/**
 * Test script for directly checking the promotions API
 */

import axios from 'axios';

// Get base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5055/api';

const testPromotionsApi = async () => {
  console.log('=== PROMOTIONS API TEST ===');
  console.log('Using API Base URL:', API_BASE_URL);
  
  try {
    // Test 1: Get all promotions
    console.log('\nTest 1: Get all promotions');
    const allPromotionsResponse = await axios.get(`${API_BASE_URL}/promotions`);
    console.log('Status:', allPromotionsResponse.status);
    console.log('Headers:', allPromotionsResponse.headers);
    console.log('Data type:', typeof allPromotionsResponse.data);
    console.log('Is array:', Array.isArray(allPromotionsResponse.data));
    
    if (typeof allPromotionsResponse.data === 'object') {
      console.log('Keys:', Object.keys(allPromotionsResponse.data));
      
      if (allPromotionsResponse.data.promotions) {
        console.log('Promotion count:', allPromotionsResponse.data.promotions.length);
        console.log('First promotion:', allPromotionsResponse.data.promotions[0]);
      }
    }
    
    // Test 2: Direct test endpoint
    console.log('\nTest 2: Direct test endpoint');
    const directTestResponse = await axios.get(`${API_BASE_URL}/direct-test/promotions`);
    console.log('Status:', directTestResponse.status);
    console.log('Data type:', typeof directTestResponse.data);
    console.log('All promotions count:', directTestResponse.data.counts.all);
    console.log('Active promotions count:', directTestResponse.data.counts.active);
    
    return {
      success: true,
      message: 'API tests completed successfully',
      data: {
        allPromotions: allPromotionsResponse.data,
        directTest: directTestResponse.data
      }
    };
  } catch (error) {
    console.error('API Test Error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      message: 'API tests failed',
      error: error.message
    };
  }
};

export default testPromotionsApi; 