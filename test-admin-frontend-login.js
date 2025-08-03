require("dotenv").config();
const axios = require("axios");

const testAdminFrontendLogin = async () => {
  try {
    console.log('=== TESTING ADMIN LOGIN FROM FRONTEND PERSPECTIVE ===');
    
    const loginData = {
      email: 'admin@gmail.com',
      password: '12345678'
    };

    console.log('Login data:', loginData);
    console.log('API URL: http://localhost:5055/api/admin/login');

    const response = await axios.post('http://localhost:5055/api/admin/login', loginData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    console.log('Token exists:', !!response.data.token);
    console.log('Admin ID:', response.data._id);
    console.log('Admin name:', response.data.name);
    console.log('Admin email:', response.data.email);
    console.log('Admin role:', response.data.role);

  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error message:', error.response.data.message);
      console.error('Full response:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Server might not be running.');
      console.error('Request error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testAdminFrontendLogin(); 