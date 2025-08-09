const verifyEmailAddress = async (req, res) => {
  const { email } = req.body;

  try {
    const token = createToken(email);
    const link = `${process.env.STORE_URL}/user/email-verification?token=${token}`;
    
    const html = `
      <div>
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${link}" target="_blank">Verify Email</a>
      </div>
    `;

    await sendEmail(
      email,
      'Email Verification - saptmarkets',
      html
    );

    res.status(200).send({
      message: 'Please check your email to verify your account!',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send({
      message: 'Failed to send verification email',
      error: error.message
    });
  }
}; 