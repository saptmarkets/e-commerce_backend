# 📱 Phone Verification System Setup Guide

## Overview
This guide explains how to set up phone verification using 1s2u.com SMS service for your SAPT Markets e-commerce application.

## 🚀 Quick Setup

### 1. Environment Variables
Add these to your `.env` file:

```env
# SMS Configuration (1s2u.com)
SMS_USERNAME=your_1s2u_username
SMS_PASSWORD=your_1s2u_password
SMS_SENDER_ID=SAPT
```

### 2. API Endpoints

#### Send Verification Code
```http
POST /api/customer/verify-phone
Content-Type: application/json

{
  "phone": "966501234567"
}
```

**Response:**
```json
{
  "message": "Verification code sent to your phone number!",
  "phoneNumber": "966***4567"
}
```

#### Verify Code and Register
```http
POST /api/customer/verify-phone-code
Content-Type: application/json

{
  "phone": "966501234567",
  "code": "123456",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Account created successfully! You can now login.",
  "customer": {
    "id": "customer_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "966501234567"
  }
}
```

## 📱 Phone Number Formats

### Supported Formats:
- `966501234567` (International with country code)
- `+966501234567` (International with +)
- `0501234567` (Local Saudi format)
- `501234567` (Local Saudi without 0)

### Validation Rules:
- Must be a valid Saudi Arabia number
- Should start with 5 (for mobile numbers)
- Will be automatically formatted to international format

## 🔧 Testing

### Run SMS Test
```bash
cd backend
node test-sms.js
```

### Test API Endpoints
```bash
# Test phone verification
curl -X POST http://localhost:5055/api/customer/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phone": "966501234567"}'

# Test code verification and registration
curl -X POST http://localhost:5055/api/customer/verify-phone-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "966501234567",
    "code": "123456",
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🔒 Security Features

### Code Expiration
- Verification codes expire after 5 minutes
- Codes are stored in memory (use Redis for production)
- One-time use only

### Rate Limiting
- Built-in rate limiting for SMS requests
- Prevents abuse and spam

### Phone Number Validation
- Validates Saudi Arabia phone number format
- Prevents duplicate registrations
- Masks phone numbers in responses

## 🛠️ Production Considerations

### 1. Use Redis for Code Storage
Replace in-memory storage with Redis:

```javascript
// In smsService.js
const redis = require('redis');
const client = redis.createClient();

// Store code with expiration
await client.setex(`phone_verification:${phone}`, 300, JSON.stringify({
  code: verificationCode,
  createdAt: new Date().toISOString()
}));
```

### 2. Add Error Handling
```javascript
// Handle specific SMS errors
if (response.data.includes('0020')) {
  throw new Error('Insufficient SMS credits');
}
if (response.data.includes('0030')) {
  throw new Error('Invalid sender ID');
}
```

### 3. Add Logging
```javascript
// Add detailed logging
console.log(`📱 SMS sent to ${phoneNumber} at ${new Date().toISOString()}`);
```

## 📊 Monitoring

### SMS Delivery Status
Monitor these response codes:
- `OK: [message_id]` - SMS sent successfully
- `00` - Invalid credentials
- `0020` - Insufficient credits
- `0030` - Invalid sender ID
- `0041` - Invalid mobile number

### Usage Tracking
Track SMS usage for billing:
```javascript
// Log SMS usage
console.log(`SMS sent to ${phoneNumber} - Cost: 1 credit`);
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid phone number format"**
   - Ensure number starts with 5 (Saudi mobile)
   - Check for proper country code (966)

2. **"Failed to send verification code"**
   - Check SMS credentials
   - Verify account has credits
   - Check sender ID is approved

3. **"Verification code expired"**
   - Codes expire after 5 minutes
   - Request new code

4. **"Invalid verification code"**
   - Double-check the code entered
   - Ensure code hasn't been used already

## 📞 Support

For 1s2u.com support:
- Email: support@1s2u.com
- Check account balance and sender ID approval
- Monitor delivery reports

## 🚀 Next Steps

1. **Configure SMS credentials** in `.env`
2. **Test the integration** with `node test-sms.js`
3. **Update frontend** to support phone verification
4. **Monitor usage** and delivery rates
5. **Set up alerts** for low credits or failed deliveries 