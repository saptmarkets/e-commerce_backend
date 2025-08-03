require('dotenv').config();
const smsService = require('./lib/phone-verification/smsService');

async function testSMS() {
  console.log('🔍 SMS Service Debug Test');
  console.log('========================');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('SMS_USERNAME:', process.env.SMS_USERNAME ? '✅ Set' : '❌ Not set');
  console.log('SMS_PASSWORD:', process.env.SMS_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('SMS_SENDER_ID:', process.env.SMS_SENDER_ID || 'SAPT');
  
  // Test phone number validation
  const testNumbers = [
    '966558852053',
    '+966558852053',
    '966558852053',
    '0558852053',
    '558852053'
  ];
  
  console.log('\n📱 Phone Number Validation Test:');
  testNumbers.forEach(number => {
    const isValid = smsService.validatePhoneNumber(number);
    console.log(`${number}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });
  
  // Test SMS sending (with a test number)
  console.log('\n📤 SMS Sending Test:');
  const testPhone = '966558852053';
  const testCode = '123456';
  
  try {
    const result = await smsService.sendVerificationCode(testPhone, testCode);
    console.log('SMS Result:', result);
  } catch (error) {
    console.error('SMS Error:', error.message);
  }
}

testSMS(); 