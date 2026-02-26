const axios = require("axios");

// ✅ Validate Indian phone numbers (basic)
function validatePhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "");
  if (/^(91)?[6-9]\d{9}$/.test(cleaned)) {
    return cleaned.startsWith("91") ? cleaned : "91" + cleaned;
  }
  return null;
}

// ✅ Send OTP via SMSIndiaHub
async function sendSMSOTP(phone, otp) {
  const SMS_API_BASE = "http://cloud.smsindiahub.in/api/mt/SendSMS";
  const USER = process.env.SMS_USER;        // add in your .env file
  const PASSWORD = process.env.SMS_PASS;    // add in your .env file
  const SENDER_ID = process.env.SMS_SENDER; // add in your .env file

  const message = `Your OTP is ${otp}. It is valid for 5 minutes.`;

  const url = `${SMS_API_BASE}?user=${USER}&password=${PASSWORD}&senderid=${SENDER_ID}&channel=Trans&DCS=0&flashsms=0&number=${phone}&text=${encodeURIComponent(message)}&route=1`;

  try {
    const response = await axios.get(url);
    console.log("✅ SMSIndiaHub Response:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ SMSIndiaHub Error:", err.message);
    throw new Error("Failed to send SMS");
  }
}

module.exports = {
  sendSMSOTP,
  validatePhoneNumber
};