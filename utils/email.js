const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP via email
const sendEmailOTP = async (email, otpCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'ServoLeY - Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">ServoLeY Verification</h2>
          <p>Dear user,</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px;">${otpCode}</span>
          </div>
          <p>This code will expire in 5 minutes. please do not share this code with anyone.</p>
          <p>Thank you,<br>ServoLeY Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to ServoLeY!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to ServoLeY, ${userName}!</h2>
          <p>Thank you for registering with us. We're excited to have you on board!</p>
          <p>ServoLeY is your one-stop solution for all your service needs. Whether you're looking for a provider or want to offer your services, we've got you covered.</p>
          <p>If you have any questions or need assistance, feel free to contact our support team.</p>
          <p>Best regards,<br>ServoLeY Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email sending failed:', error);
    throw new Error('Failed to send welcome email');
  }
};

module.exports = {
  sendEmailOTP,
  sendWelcomeEmail
};
