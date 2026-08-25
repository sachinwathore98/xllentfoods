const SibApiV3Sdk = require('@getbrevo/brevo');

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendOTPEmail = async (toEmail, otpCode, recipientName = 'Partner') => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.sender = { 
    email: process.env.SENDER_EMAIL, 
    name: process.env.SENDER_NAME || "Xellent Food Products" 
  };
  sendSmtpEmail.to = [{ email: toEmail, name: recipientName }];
  sendSmtpEmail.subject = "Your Verification Code - Xellent DMS";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #d97706; text-align: center;">Xellent Food Products</h2>
      <p>Hello <b>${recipientName}</b>,</p>
      <p>You requested an OTP for login or password reset on the Xellent Distribution Management System.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; background: #fef3c7; color: #b45309; padding: 12px 24px; letter-spacing: 6px; border-radius: 8px; display: inline-block;">${otpCode}</span>
      </div>
      <p>This code is valid for 10 minutes. Do not share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Xellent Food Products B2B Distribution Network</p>
    </div>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error("Brevo Email Error:", error);
    throw new Error("Failed to send OTP email via Brevo");
  }
};

module.exports = { sendOTPEmail };