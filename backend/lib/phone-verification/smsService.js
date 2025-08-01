const axios = require('axios');

class SMSService {
  constructor() {
    this.username = process.env.SMS_USERNAME;
    this.password = process.env.SMS_PASSWORD;
    this.senderId = process.env.SMS_SENDER_ID || 'SAPT';
    this.baseUrl = 'https://api.1s2u.io/bulksms';
  }

  // Send verification code via SMS
  async sendVerificationCode(phoneNumber, verificationCode) {
    try {
      // Remove any + or 00 prefix from phone number
      let cleanPhone = phoneNumber.replace(/^(\+|00)/, '');
      
      // Ensure it starts with country code for Saudi Arabia
      if (!cleanPhone.startsWith('966')) {
        cleanPhone = '966' + cleanPhone.replace(/^0/, '');
      }

      const message = `Your SAPT Markets verification code is: ${verificationCode}. Valid for 5 minutes.`;
      
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&mt=0&sid=${this.senderId}&mno=${cleanPhone}&msg=${encodeURIComponent(message)}`;

      console.log(`📱 Sending SMS to ${cleanPhone} with code ${verificationCode}`);

      const response = await axios.get(url);
      
      console.log('📱 SMS Response:', response.data);

      // Check if SMS was sent successfully
      if (response.data && response.data.startsWith('OK:')) {
        console.log('✅ SMS sent successfully');
        return true;
      } else {
        console.error('❌ SMS failed:', response.data);
        return false;
      }

    } catch (error) {
      console.error('❌ SMS service error:', error.message);
      return false;
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Remove any + or 00 prefix
    let cleanPhone = phoneNumber.replace(/^(\+|00)/, '');
    
    // Remove any spaces or special characters
    cleanPhone = cleanPhone.replace(/\s+/g, '');
    
    // Check if it's a valid Saudi Arabia number
    // Should be 966 + 9 digits (total 12 digits)
    if (cleanPhone.startsWith('966') && cleanPhone.length === 12) {
      return true;
    }
    
    // Check if it's a local Saudi number (9 digits starting with 5)
    if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
      return true;
    }
    
    return false;
  }

  // Generate a 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

module.exports = new SMSService(); 