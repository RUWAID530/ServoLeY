const crypto = require('crypto');
const { prisma } = require('../config/database');

// Generate OTP code
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

// Create OTP record
const createOTP = async (userId, type = 'SMS') => {
  try {
    const code = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_IN) || 300) * 1000);

    // Delete any existing unused OTPs for this user
    await prisma.oTP.deleteMany({
      where: {
        userId,
        isUsed: false
      }
    });

    // Create new OTP
    const otp = await prisma.oTP.create({
      data: {
        userId,
        code,
        type,
        expiresAt
      }
    });

    return { code, otp };
  } catch (error) {
    console.error('Error creating OTP:', error);
    throw new Error('Failed to create OTP');
  }
};

// Verify OTP
const verifyOTP = async (userId, code) => {
  try {
    const otp = await prisma.oTP.findFirst({
      where: {
        userId,
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!otp) {
      return { valid: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true }
    });

    return { valid: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Failed to verify OTP');
  }
};

// Clean expired OTPs
const cleanExpiredOTPs = async () => {
  try {
    const result = await prisma.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    console.log(`Cleaned ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning expired OTPs:', error);
    return 0;
  }
};

// Schedule OTP cleanup (run every hour)
setInterval(cleanExpiredOTPs, 60 * 60 * 1000);

module.exports = {
  generateOTP,
  createOTP,
  verifyOTP,
  cleanExpiredOTPs
};


