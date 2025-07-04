const axios = require('axios');

async function testOrderDetailsAPI() {
  try {
    const baseURL = 'http://localhost:5055/api/mobile-delivery';
    
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${baseURL}/login`, {
      email: 'driver@saptmarkets.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      
      // Get orders to find an order ID
      console.log('📦 Getting orders...');
      const ordersResponse = await axios.get(`${baseURL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
        const firstOrder = ordersResponse.data.orders[0];
        console.log('✅ Found order:', firstOrder.orderNumber, 'Total:', firstOrder.total);
        
        // Get order details
        console.log('📋 Getting order details...');
        const detailsResponse = await axios.get(`${baseURL}/orders/${firstOrder._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Order details response:');
        console.log('- Success:', detailsResponse.data.success);
        console.log('- Financial data:', detailsResponse.data.data?.financial);
        console.log('- Total from financial:', detailsResponse.data.data?.financial?.total);
        console.log('- Direct total:', detailsResponse.data.data?.total);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOrderDetailsAPI(); 