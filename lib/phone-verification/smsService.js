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
      // Clean and format phone number
      let cleanPhone = this.formatPhoneNumber(phoneNumber);
      
      console.log(`📱 Original phone: ${phoneNumber}`);
      console.log(`📱 Cleaned phone: ${cleanPhone}`);
      
      // Validate phone number
      if (!this.validatePhoneNumber(cleanPhone)) {
        console.error('❌ Invalid phone number format:', cleanPhone);
        return false;
      }

      const message = `Your SAPT Markets verification code is: ${verificationCode}. Valid for 5 minutes.`;
      
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&mt=0&sid=${this.senderId}&mno=${cleanPhone}&msg=${encodeURIComponent(message)}`;

      console.log(`📱 Sending SMS to ${cleanPhone} with code ${verificationCode}`);
      console.log(`📱 SMS URL: ${this.baseUrl}?username=${this.username}&password=***&mt=0&sid=${this.senderId}&mno=${cleanPhone}&msg=${encodeURIComponent(message)}`);

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
      if (error.response) {
        console.error('❌ SMS response error:', error.response.data);
      }
      return false;
    }
  }

  // Format phone number for SMS service
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove any + or 00 prefix
    let cleanPhone = phoneNumber.replace(/^(\+|00)/, '');
    
    // Remove any spaces, dashes, or special characters
    cleanPhone = cleanPhone.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with 966, keep it as is
    if (cleanPhone.startsWith('966')) {
      return cleanPhone;
    }
    
    // If it's a 9-digit number starting with 5 (Saudi mobile), add 966
    if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
      return '966' + cleanPhone;
    }
    
    // If it's a 10-digit number starting with 05, remove the 0 and add 966
    if (cleanPhone.length === 10 && cleanPhone.startsWith('05')) {
      return '966' + cleanPhone.substring(1);
    }
    
    // If it's a 10-digit number starting with 966, keep it
    if (cleanPhone.length === 12 && cleanPhone.startsWith('966')) {
      return cleanPhone;
    }
    
    return cleanPhone;
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Remove any spaces or special characters
    let cleanPhone = phoneNumber.replace(/\s+/g, '');
    
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