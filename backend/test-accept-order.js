const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const DRIVER_EMAIL = 'driver@saptmarkets.com';
const DRIVER_PASSWORD = 'password123';

// Test data
const ORDERS_TO_TEST = [
  '685b032e2871592b18646625', // Use the actual order ID from the logs
];

async function testAcceptOrderFlow() {
  console.log('🧪 Testing Accept Order Flow...\n');
  
  try {
    // Step 1: Login as driver
    console.log('1️⃣ Logging in as driver...');
    const loginResponse = await axios.post(`${BASE_URL}/api/mobile-delivery/auth/login`, {
      email: DRIVER_EMAIL,
      password: DRIVER_PASSWORD
    });
    
    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }
    
    const token = loginResponse.data.token;
    const driverId = loginResponse.data.user.userId;
    console.log('✅ Driver logged in successfully:', driverId);
    
    // Step 2: Get current orders
    console.log('\n2️⃣ Getting current orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/api/mobile-delivery/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Current orders:', ordersResponse.data.orders?.length || 0);
    
    // Step 3: Test accept order
    for (const orderId of ORDERS_TO_TEST) {
      console.log(`\n3️⃣ Testing accept order: ${orderId}`);
      
      try {
        const acceptResponse = await axios.post(`${BASE_URL}/api/mobile-delivery/orders/${orderId}/accept`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (acceptResponse.data.success) {
          console.log('✅ Order accepted successfully:', acceptResponse.data.message);
          console.log('📊 Order details:', acceptResponse.data.data);
        } else {
          console.log('❌ Failed to accept order:', acceptResponse.data.message);
        }
        
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('⚠️ Order already assigned:', error.response.data.message);
        } else {
          console.log('❌ Error accepting order:', error.response?.data?.message || error.message);
        }
      }
    }
    
    // Step 4: Test product checklist access
    console.log('\n4️⃣ Testing product checklist access...');
    const testOrderId = ORDERS_TO_TEST[0];
    const testProductId = '644501ab7094a0000851284b'; // From the logs
    
    try {
      const toggleResponse = await axios.post(`${BASE_URL}/api/mobile-delivery/orders/${testOrderId}/toggle-product`, {
        productId: testProductId,
        collected: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (toggleResponse.data.success) {
        console.log('✅ Product checklist updated successfully');
      } else {
        console.log('❌ Failed to update product checklist:', toggleResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error updating product checklist:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAcceptOrderFlow(); 