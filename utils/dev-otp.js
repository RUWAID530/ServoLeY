// Development OTP utility for testing without actual SMS/Email services

// Store development OTPs in memory (for testing only)
const devOTPs = new Map();

// Generate OTP code
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
};

// Create OTP record (development version)
const createDevOTP = async (userId, type = 'SMS') => {
  try {
    const code = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);

    // Store in memory for development
    devOTPs.set(userId, {
      code,
      type,
      expiresAt: new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_IN) || 300) * 1000),
      isUsed: false
    });

    console.log(`\n🔔 DEVELOPMENT OTP: ${code} for user ${userId} (${type})\n`);

    return { code, otp: { id: userId } };
  } catch (error) {
    console.error('Error creating development OTP:', error);
    throw new Error('Failed to create OTP');
  }
};

// Verify OTP (development version)
const verifyDevOTP = async (userId, code) => {
  try {
    const otp = devOTPs.get(userId);

    if (!otp || otp.isUsed || otp.expiresAt < new Date()) {
      return { valid: false, message: 'Invalid or expired OTP' };
    }

    if (otp.code !== code) {
      return { valid: false, message: 'Invalid OTP' };
    }

    // Mark OTP as used
    otp.isUsed = true;

    return { valid: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying development OTP:', error);
    throw new Error('Failed to verify OTP');
  }
};

// Send SMS OTP (development version)
const sendDevSMSOTP = async (phoneNumber, otpCode) => {
  console.log(`📱 DEVELOPMENT: Would send SMS to ${phoneNumber} with OTP: ${otpCode}`);
  return { success: true, messageId: 'dev-sms-id' };
};

// Send Email OTP (development version)
const sendDevEmailOTP = async (email, otpCode) => {
  console.log(`📧 DEVELOPMENT: Would send email to ${email} with OTP: ${otpCode}`);
  return { success: true, messageId: 'dev-email-id' };
};

module.exports = {
  createDevOTP,
  verifyDevOTP,
  sendDevSMSOTP,
  sendDevEmailOTP
};
