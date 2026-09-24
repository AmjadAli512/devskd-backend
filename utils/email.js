const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Warning: BREVO_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailFrom = process.env.EMAIL_FROM || 'hrdevskd@gmail.com';
    const emailFromName = process.env.EMAIL_FROM_NAME || 'DevSKD';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Hello,</p>
        <p>We received a request to reset your DevSKD password.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: #fff; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔗 Password reset URL for ${toEmail}: ${resetUrl}`);
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        sender: { name: emailFromName, email: emailFrom },
        to: [{ email: toEmail }],
        subject: 'Reset your DevSKD password',
        htmlContent
      })
    });

    const responseText = await response.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    if (!response.ok) {
      const error = typeof responseBody === 'object' && responseBody !== null
        ? responseBody.message || responseBody.error || JSON.stringify(responseBody)
        : responseBody || `Brevo request failed with status ${response.status}`;
      return { success: false, error };
    }

    return { success: true, data: responseBody };
  } catch (error) {
    console.error('Password reset email error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPasswordResetEmail };
