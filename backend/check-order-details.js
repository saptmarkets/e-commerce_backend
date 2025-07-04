const axios = require('axios');

async function checkOrderDetails() {
  try {
    const baseURL = 'http://localhost:5055/api/mobile-delivery';
    
    console.log('🔐 Testing login...');
    const loginResponse = await axios.post(`${baseURL}/login`, {
      email: 'driver@saptmarkets.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      
      console.log('📦 Getting orders...');
      const ordersResponse = await axios.get(`${baseURL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
        const firstOrder = ordersResponse.data.orders[0];
        console.log('Found order:', firstOrder.orderNumber, 'Total:', firstOrder.total);
        
        console.log('📋 Getting order details...');
        const detailsResponse = await axios.get(`${baseURL}/orders/${firstOrder._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Order details response:');
        console.log('Success:', detailsResponse.data.success);
        if (detailsResponse.data.data && detailsResponse.data.data.financial) {
          console.log('Financial data found:', detailsResponse.data.data.financial);
        } else {
          console.log('No financial data in response');
          console.log('Available keys:', Object.keys(detailsResponse.data.data || {}));
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOrderDetails(); 