const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS OTP
const sendSMSOTP = async (phoneNumber, otpCode) => {
  try {
    const message = await client.messages.create({
      body: `Your ServoLeY verification code is: ${otpCode}. This code expires in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`SMS sent to ${phoneNumber}: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error('Failed to send SMS');
  }
};

// Send SMS notification
const sendSMSNotification = async (phoneNumber, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`SMS notification sent to ${phoneNumber}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('SMS notification failed:', error);
    throw new Error('Failed to send SMS notification');
  }
};

// Verify phone number format
const validatePhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Indian mobile number
  if (cleaned.length === 10 && cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9')) {
    return `+91${cleaned}`;
  }
  
  // Check if it already has country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  return null;
};

module.exports = {
  sendSMSOTP,
  sendSMSNotification,
  validatePhoneNumber
};


