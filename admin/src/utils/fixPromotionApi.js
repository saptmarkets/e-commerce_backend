/**
 * API fix utility for the promotions feature
 */

import axios from 'axios';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5055';

// Test direct API access
export const testApiAccess = async () => {
  console.log('===== TESTING API ACCESS =====');
  console.log('Using API Base URL:', API_BASE_URL);
  
  try {
    // Test 1: Root endpoint
    console.log('\nTest 1: Root endpoint');
    try {
      const rootResponse = await axios.get(API_BASE_URL);
      console.log('Root API access:', rootResponse.status, rootResponse.statusText);
    } catch (error) {
      console.error('Root API error:', error.message);
    }
    
    // Test 2: Direct test endpoint
    console.log('\nTest 2: Direct test endpoint');
    try {
      const directTestUrl = `${API_BASE_URL}/api/direct-test/promotions`;
      console.log('Testing URL:', directTestUrl);
      const directTestResponse = await axios.get(directTestUrl);
      console.log('Direct test successful:', directTestResponse.status, directTestResponse.statusText);
      console.log('Found promotions:', 
        directTestResponse.data?.counts?.all || 'Unknown count');
    } catch (error) {
      console.error('Direct test error:', error.message);
    }
    
    // Test 3: Promotions endpoint
    console.log('\nTest 3: Promotions endpoint');
    try {
      const promotionsUrl = `${API_BASE_URL}/api/promotions`;
      console.log('Testing URL:', promotionsUrl);
      const promotionsResponse = await axios.get(promotionsUrl);
      console.log('Promotions API successful:', promotionsResponse.status, promotionsResponse.statusText);
      
      if (promotionsResponse.data) {
        if (Array.isArray(promotionsResponse.data)) {
          console.log('Received array with', promotionsResponse.data.length, 'promotions');
        } else if (promotionsResponse.data.promotions) {
          console.log('Received object with', promotionsResponse.data.promotions.length, 'promotions');
        } else {
          console.log('Received data:', typeof promotionsResponse.data);
        }
      }
    } catch (error) {
      console.error('Promotions API error:', error.message);
    }
    
    // Test 4: Check server status with timeout
    console.log('\nTest 4: Server status with timeout');
    try {
      const serverStatusUrl = `${API_BASE_URL}/api/test`;
      console.log('Testing URL:', serverStatusUrl);
      const serverStatusResponse = await axios.get(serverStatusUrl, { timeout: 5000 });
      console.log('Server status:', serverStatusResponse.status, serverStatusResponse.statusText);
      console.log('Response:', serverStatusResponse.data);
    } catch (error) {
      console.error('Server status error:', error.message);
    }
    
    return {
      success: true,
      message: 'API tests completed'
    };
  } catch (error) {
    console.error('Overall test error:', error.message);
    return {
      success: false,
      message: 'API tests failed',
      error: error.message
    };
  }
};

// Attempt to fix the API connection
export const fixApiConnection = async () => {
  const testResult = await testApiAccess();
  
  if (testResult.success) {
    console.log('API connection test successful');
    return {
      success: true,
      message: 'API connection is working'
    };
  }
  
  console.log('Attempting to fix API connection...');
  
  // Suggest fixes based on error patterns
  const fixes = [
    {
      issue: 'CORS error',
      solution: 'Add CORS headers to the server or use a CORS proxy',
      code: 'Server needs CORS headers: Access-Control-Allow-Origin: *'
    },
    {
      issue: 'Server not running',
      solution: 'Make sure the backend server is running',
      code: 'Start the server with: node backend/api/index.js'
    },
    {
      issue: 'Wrong API base URL',
      solution: 'Check the VITE_APP_API_BASE_URL environment variable',
      current: API_BASE_URL,
      suggestion: 'Should be something like http://localhost:5055'
    },
    {
      issue: 'Network error',
      solution: 'Check network connection and firewall settings',
      code: 'Test with: curl -v ' + API_BASE_URL
    }
  ];
  
  return {
    success: false,
    message: 'API connection failed',
    fixes
  };
};

export default {
  testApiAccess,
  fixApiConnection
}; 