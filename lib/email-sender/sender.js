const sgMail = require('@sendgrid/mail');
const rateLimit = require('express-rate-limit');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // limit each IP to 20 requests per windowMs
});

const sendEmail = async (emailData) => {
  try {
    const msg = {
      to: emailData.to,
      from: process.env.SENDER_EMAIL,
      subject: emailData.subject,
      html: emailData.html,
    };
    
    await sgMail.send(msg);
    return {
      message: 'Email sent successfully',
      status: 'success'
    };
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error Response:', error.response.body);
    }
    throw new Error('Failed to send email');
        }
};

//limit email verification and forget password
const minutes = 30;
const emailVerificationLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

const passwordVerificationLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

const supportMessageLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

const phoneVerificationLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 2,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

module.exports = {
  sendEmail,
  emailVerificationLimit,
  passwordVerificationLimit,
  supportMessageLimit,
  phoneVerificationLimit,
  limiter
};
