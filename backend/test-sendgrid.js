require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create a test message
const msg = {
  to: 'asadji.bkt@gmail.com', // The email you're trying to verify
  from: process.env.SENDER_EMAIL, // Your verified sender
  subject: 'SendGrid Test Email',
  text: 'This is a test email from SendGrid',
  html: '<strong>This is a test email from SendGrid</strong>',
};

// Send the test email
sgMail
  .send(msg)
  .then(() => {
    console.log('Test email sent successfully');
    console.log('From:', process.env.SENDER_EMAIL);
    console.log('API Key:', process.env.SENDGRID_API_KEY.substring(0, 10) + '...');
  })
  .catch((error) => {
    console.error('Error sending test email:');
    console.error(error.response ? error.response.body : error);
  }); 