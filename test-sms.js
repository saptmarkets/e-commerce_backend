require('dotenv').config();
const smsService = require('./lib/phone-verification/smsService');

async function testSMS() {
  console.log('🧪 Testing SMS Integration...');
  
  // Test phone number validation
  const testNumbers = [
    '966501234567',
    '+966501234567',
    '0501234567',
    '501234567',
    'invalid'
  ];
  
  console.log('\n📱 Testing phone number validation:');
  testNumbers.forEach(number => {
    const isValid = smsService.validatePhoneNumber(number);
    console.log(`${number} -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });
  
  // Test verification code generation
  console.log('\n🔢 Testing verification code generation:');
  for (let i = 0; i < 3; i++) {
    const code = smsService.generateVerificationCode();
    console.log(`Generated code: ${code}`);
  }
  
  // Test SMS sending (only if credentials are configured)
  if (process.env.SMS_USERNAME && process.env.SMS_PASSWORD) {
    console.log('\n📤 Testing SMS sending...');
    console.log('⚠️  This will send a real SMS. Make sure you have credits!');
    
    const testPhone = process.env.TEST_PHONE || '966501234567';
    const testCode = '123456';
    
    try {
      const result = await smsService.sendVerificationCode(testPhone, testCode);
      console.log(`SMS sending result: ${result ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.error('❌ SMS test failed:', error.message);
    }
  } else {
    console.log('\n⚠️  SMS credentials not configured. Set SMS_USERNAME and SMS_PASSWORD to test SMS sending.');
  }
  
  console.log('\n✅ SMS integration test completed!');
}

testSMS().catch(console.error); 