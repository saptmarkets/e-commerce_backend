require('dotenv').config();
const axios = require('axios');

async function testSMSDirect() {
  console.log('🔍 Direct SMS Test');
  console.log('==================');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('SMS_USERNAME:', process.env.SMS_USERNAME);
  console.log('SMS_PASSWORD:', process.env.SMS_PASSWORD ? '***' : 'Not set');
  console.log('SMS_SENDER_ID:', process.env.SMS_SENDER_ID || 'SAPT');
  
  if (!process.env.SMS_USERNAME || !process.env.SMS_PASSWORD) {
    console.error('❌ SMS credentials not configured!');
    return;
  }
  
  // Test phone number
  const phoneNumber = '966558852053';
  const testCode = '123456';
  const message = `Test SMS from SAPT: ${testCode}`;
  
  console.log(`\n📱 Testing SMS to: ${phoneNumber}`);
  console.log(`📱 Message: ${message}`);
  
  const url = `https://api.1s2u.io/bulksms?username=${process.env.SMS_USERNAME}&password=${process.env.SMS_PASSWORD}&mt=0&sid=${process.env.SMS_SENDER_ID || 'SAPT'}&mno=${phoneNumber}&msg=${encodeURIComponent(message)}`;
  
  console.log(`\n📤 SMS URL: ${url.replace(process.env.SMS_PASSWORD, '***')}`);
  
  try {
    const response = await axios.get(url);
    console.log('\n📱 SMS Response:', response.data);
    
    if (response.data && response.data.startsWith('OK:')) {
      console.log('✅ SMS sent successfully!');
      console.log('📱 Please check your phone for the SMS');
    } else {
      console.log('❌ SMS failed:', response.data);
    }
  } catch (error) {
    console.error('❌ SMS Error:', error.message);
    if (error.response) {
      console.error('❌ Response Error:', error.response.data);
    }
  }
}

testSMSDirect(); 