const { sendEmail } = require("../email-sender/sender");

class EmailVerificationService {
  constructor() {
    this.baseUrl = process.env.STORE_URL || 'https://e-commerce-customer-three.vercel.app';
  }

  // Generate a 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create email verification template
  createVerificationEmailTemplate(name, verificationCode) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - SAPT Markets</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
            }
            .verification-code {
                background-color: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
                font-size: 24px;
                font-weight: bold;
                color: #495057;
                letter-spacing: 3px;
            }
            .button {
                display: inline-block;
                background-color: #22c55e;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                font-size: 12px;
                color: #6c757d;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://collection.cloudinary.com/dxjobesyt/6704dab21184b81934b64d7cf6fe1a8c" alt="SAPT Markets" class="logo">
                <h1>Email Verification</h1>
            </div>
            
            <h2>Hello ${name},</h2>
            
            <p>Thank you for signing up with SAPT Markets! To complete your registration, please use the verification code below:</p>
            
            <div class="verification-code">
                ${verificationCode}
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This code will expire in <strong>10 minutes</strong></li>
                <li>Enter this code in the verification page to complete your registration</li>
                <li>If you didn't request this verification, please ignore this email</li>
            </ul>
            
            <p>If you have any questions, please contact us at <a href="mailto:support@saptmarkets.com">support@saptmarkets.com</a></p>
            
            <div class="footer">
                <p>&copy; 2024 SAPT Markets. All rights reserved.</p>
                <p>This email was sent to verify your account registration.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Send verification code via email
  async sendVerificationCode(email, name, verificationCode) {
    try {
      const htmlBody = this.createVerificationEmailTemplate(name, verificationCode);
      
      const emailData = {
        to: email,
        subject: 'SAPT Markets - Email Verification Code',
        html: htmlBody,
      };

      console.log(`📧 Sending email verification to ${email} with code ${verificationCode}`);
      
      await sendEmail(emailData);
      
      console.log('✅ Email verification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Email verification error:', error.message);
      return false;
    }
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new EmailVerificationService(); 